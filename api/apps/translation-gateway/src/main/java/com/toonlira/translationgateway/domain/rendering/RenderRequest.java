package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_INPUT;

import com.toonlira.translationgateway.domain.OcrGeometry;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationLimits;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationResult;
import com.toonlira.translationgateway.domain.translation.TranslationValidationException;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Immutable binding of already verified media, OCR and translation artifacts. */
public final class RenderRequest {
    private final UUID jobRef;
    private final RenderSource source;
    private final LanguagePair pair;
    private final String ocrSha256;
    private final String translationSha256;
    private final RenderPolicy policy;
    private final List<Region> regions;
    private final Set<UUID> captionHints;
    private final Set<UUID> letteringHints;
    private final Set<UUID> drawnHints;
    private final List<com.toonlira.translationgateway.domain.layout.LayoutBox> bubbles;

    private RenderRequest(RenderRequest base, Set<UUID> captionHints, Set<UUID> letteringHints, Set<UUID> drawnHints,
                          List<com.toonlira.translationgateway.domain.layout.LayoutBox> bubbles) {
        this.jobRef = base.jobRef;
        this.source = base.source;
        this.pair = base.pair;
        this.ocrSha256 = base.ocrSha256;
        this.translationSha256 = base.translationSha256;
        this.policy = base.policy;
        this.regions = base.regions;
        this.captionHints = Set.copyOf(captionHints);
        this.letteringHints = Set.copyOf(letteringHints);
        this.drawnHints = Set.copyOf(drawnHints);
        this.bubbles = List.copyOf(bubbles);
    }

    private RenderRequest(RenderSource source, OcrManifest ocr, TranslationResult translation,
                          String ocrSha256, String translationSha256, RenderPolicy policy) {
        this.jobRef = ocr.jobRef();
        this.source = source;
        this.pair = translation.pair();
        this.ocrSha256 = ocrSha256;
        this.translationSha256 = translationSha256;
        this.policy = policy;
        this.regions = ocr.regions().stream().map(region -> new Region(region.id(), region.readingOrder(),
            region.sourceText(), translation.regions().get(region.readingOrder()).translatedText(),
            List.copyOf(region.polygon()))).toList();
        this.captionHints = Set.of();
        this.letteringHints = Set.of();
        this.drawnHints = Set.of();
        this.bubbles = List.of();
    }

    /**
     * Regions that read as speech or captions (not sound effects). Only a hint: a renderer that can inpaint may
     * redraw such a region over reconstructed artwork when its lettering sits on art; others ignore it.
     */
    public RenderRequest withCaptionHints(Set<UUID> hints) {
        var ids = regions.stream().map(Region::id).collect(java.util.stream.Collectors.toSet());
        if (hints == null || !ids.containsAll(hints)) invalid();
        return new RenderRequest(this, hints, letteringHints, drawnHints, bubbles);
    }

    public Set<UUID> captionHints() { return captionHints; }

    /**
     * Regions that are hand-drawn lettering of a sentence (a shout drawn over the art, which the detector does not
     * see as a text box). Only a hint: a renderer that can inpaint may redraw it in a heavy face, slanted like the
     * original; others keep the drawing.
     */
    public RenderRequest withLetteringHints(Set<UUID> hints) {
        var ids = regions.stream().map(Region::id).collect(java.util.stream.Collectors.toSet());
        if (hints == null || !ids.containsAll(hints)) invalid();
        return new RenderRequest(this, captionHints, hints, drawnHints, bubbles);
    }

    public Set<UUID> letteringHints() { return letteringHints; }

    /**
     * Drawn text that is not speech: regions the detector does not see as text, outside every balloon, that do not
     * read as a sentence (sound effects, screens, signs, file names on a drawn desktop). A renderer keeps them as drawn.
     */
    public RenderRequest withDrawnHints(Set<UUID> hints) {
        var ids = regions.stream().map(Region::id).collect(java.util.stream.Collectors.toSet());
        if (hints == null || !ids.containsAll(hints)) invalid();
        return new RenderRequest(this, captionHints, letteringHints, hints, bubbles);
    }

    public Set<UUID> drawnHints() { return drawnHints; }

    /**
     * Speech balloons detected on this page (normalized boxes, from the layout artifact of the same image and OCR
     * manifest). A hint that bounds where a region's balloon mask and layout may extend; empty when unknown.
     */
    public RenderRequest withBubbles(List<com.toonlira.translationgateway.domain.layout.LayoutBox> detected) {
        // stream check: List.of(...).contains(null) itself throws on immutable lists.
        if (detected == null || detected.size() > 256 || detected.stream().anyMatch(java.util.Objects::isNull)) invalid();
        return new RenderRequest(this, captionHints, letteringHints, drawnHints, detected);
    }

    public List<com.toonlira.translationgateway.domain.layout.LayoutBox> bubbles() { return bubbles; }

    public static RenderRequest create(RenderSource source, OcrManifest ocr, TranslationResult translation,
                                       String ocrSha256, String translationSha256, RenderPolicy policy) {
        validateMedia(source, policy);
        if (ocr == null || translation == null || !"1.0".equals(ocr.version()) || ocr.jobRef() == null
            || !ocr.jobRef().equals(translation.jobRef()) || translation.pair() == null
            || !translation.pair().source().equals(ocr.sourceLanguage())
            || ocr.widthPx() != source.widthPx() || ocr.heightPx() != source.heightPx()
            || ocr.regions() == null || ocr.regions().size() > TranslationLimits.MAX_REGIONS
            || translation.regions().size() != ocr.regions().size()
            || !validHash(ocrSha256) || !validHash(translationSha256)) invalid();
        ocr = snapshot(ocr);
        if (translation.regions().size() != ocr.regions().size()) invalid();
        for (int order = 0; order < ocr.regions().size(); order++) {
            var region = ocr.regions().get(order);
            var target = translation.regions().get(order);
            if (region == null || region.id() == null || region.readingOrder() != order
                || !OcrGeometry.valid(region.polygon()) || target == null
                || !region.id().equals(target.id()) || target.readingOrder() != order) invalid();
        }
        validateTexts(ocr, translation);
        return new RenderRequest(source, ocr, translation, ocrSha256, translationSha256, policy);
    }

    private static void validateMedia(RenderSource source, RenderPolicy policy) {
        if (source == null || policy == null || source.byteSize() > policy.maxOriginalBytes()
            || source.widthPx() > policy.maxWidthPx() || source.heightPx() > policy.maxHeightPx()
            || (long) source.widthPx() * source.heightPx() > policy.maxPixels()) invalid();
    }

    private static OcrManifest snapshot(OcrManifest ocr) {
        try {
            // Freeze both collection levels before checking geometry/text, not after validation.
            var sourceRegions = List.copyOf(ocr.regions());
            if (sourceRegions.size() > TranslationLimits.MAX_REGIONS) invalid();
            var regions = sourceRegions.stream().map(region -> new OcrManifest.Region(region.id(),
                region.readingOrder(), region.sourceText(), List.copyOf(region.polygon()))).toList();
            return new OcrManifest(ocr.version(), ocr.jobRef(), ocr.sourceLanguage(), ocr.widthPx(), ocr.heightPx(), regions);
        } catch (RuntimeException error) {
            throw new RenderValidationException(INVALID_INPUT);
        }
    }

    private static void validateTexts(OcrManifest ocr, TranslationResult translation) {
        try {
            var request = new TranslationRequest(ocr.jobRef(), translation.pair(), ocr.regions().stream()
                .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
            var response = new TranslationResponse(translation.regions().stream()
                .map(region -> new TranslationResponse.Region(region.id(), region.translatedText())).toList());
            new TranslationValidator(Set.of(translation.pair())).validateResponse(request, response);
        } catch (TranslationValidationException error) {
            // Do not propagate representations or causes from an input contract.
            invalid();
        }
    }

    private static boolean validHash(String value) { return value != null && value.matches("[0-9a-f]{64}"); }
    private static void invalid() { throw new RenderValidationException(INVALID_INPUT); }

    public UUID jobRef() { return jobRef; }
    public RenderSource source() { return source; }
    public LanguagePair pair() { return pair; }
    public String ocrSha256() { return ocrSha256; }
    public String translationSha256() { return translationSha256; }
    public RenderPolicy policy() { return policy; }
    public List<Region> regions() { return regions; }
    @Override public String toString() { return "RenderRequest[redacted]"; }

    public record Region(UUID id, int readingOrder, String sourceText, String translatedText,
                         List<OcrManifest.Vertex> polygon) {
        public Region { polygon = List.copyOf(polygon); }
        @Override public String toString() { return "RenderRequest.Region[redacted]"; }
    }
}
