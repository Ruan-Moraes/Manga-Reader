package com.toonlira.translationgateway.domain.layout;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;

import static com.toonlira.translationgateway.domain.layout.LayoutParameters.*;

/** Conservative greedy suppression: only retained detections can suppress a candidate. */
public final class BubbleDeduplicator {
    private static final Comparator<Bubble> PRIORITY = Comparator.comparingDouble(Bubble::confidence).reversed()
        .thenComparingDouble(b -> b.bounds().left()).thenComparingDouble(b -> b.bounds().top())
        .thenComparingDouble(b -> b.bounds().right()).thenComparingDouble(b -> b.bounds().bottom())
        .thenComparing(Bubble::id);

    public record Suppression(Bubble bubble, String retainedBubbleId, double iou, String reason) { }
    public record Result(List<Bubble> retained, List<Suppression> suppressed) { }

    public static Result filter(List<Bubble> candidates) {
        if (candidates == null) throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
        if (candidates.size() > MAX_BUBBLES) throw new LayoutFailure(LayoutFailure.Code.LIMIT_EXCEEDED);
        var ids = new HashSet<String>();
        for (var bubble : candidates) {
            if (bubble == null || bubble.id() == null || bubble.id().isBlank() || bubble.id().length() > 128
                || !ids.add(bubble.id()) || bubble.bounds() == null || !Double.isFinite(bubble.confidence())
                || bubble.confidence() < CONFIDENCE || bubble.confidence() > 1)
                throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
        }
        var retained = new ArrayList<Bubble>();
        var suppressed = new ArrayList<Suppression>();
        for (var candidate : candidates.stream().sorted(PRIORITY).toList()) {
            var winner = retained.stream().filter(b -> iou(b.bounds(), candidate.bounds()) >= DUPLICATE_IOU)
                .findFirst();
            if (winner.isEmpty()) retained.add(candidate);
            else suppressed.add(new Suppression(candidate, winner.get().id(),
                iou(winner.get().bounds(), candidate.bounds()), "near-duplicate"));
        }
        return new Result(List.copyOf(retained), List.copyOf(suppressed));
    }

    public static double iou(LayoutBox a, LayoutBox b) {
        double intersection = Math.max(0, Math.min(a.right(), b.right()) - Math.max(a.left(), b.left()))
            * Math.max(0, Math.min(a.bottom(), b.bottom()) - Math.max(a.top(), b.top()));
        double areaA = (a.right() - a.left()) * (a.bottom() - a.top());
        double areaB = (b.right() - b.left()) * (b.bottom() - b.top());
        return intersection / (areaA + areaB - intersection);
    }

    public static void validateAudit(LayoutManifest manifest) {
        if (!"1.1".equals(manifest.layoutVersion())) return;
        if (manifest.suppressedBubbles() == null || manifest.bubbles() == null)
            throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
        var original = new ArrayList<>(manifest.bubbles());
        for (var suppression : manifest.suppressedBubbles()) {
            if (suppression == null) throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
            original.add(suppression.bubble());
        }
        var expected = filter(original);
        if (!expected.retained().equals(manifest.bubbles()) || !expected.suppressed().equals(manifest.suppressedBubbles())
            || !ALGORITHM_REVISION.equals(manifest.algorithmRevision()) || manifest.parameters() == null
            || manifest.parameters().get("duplicateIou") == null
            || manifest.parameters().get("duplicateIou").doubleValue() != DUPLICATE_IOU)
            throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
        var retainedIds = manifest.bubbles().stream().map(Bubble::id).toList();
        if (manifest.associations().stream().anyMatch(a -> !retainedIds.containsAll(a.bubbleCandidates()))
            || manifest.groups().stream().anyMatch(g -> !retainedIds.contains(g.bubbleId())))
            throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
    }

    private BubbleDeduplicator() { }
}
