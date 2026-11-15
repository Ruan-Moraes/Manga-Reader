package com.toonlira.translationgateway.domain.translation;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * One word split across neighbouring balloons, a character per balloon (「あ」 「ら」 = 「あら」, "oh my"), is
 * translated as one segment: alone each piece is a meaningless syllable ("Ah" / "ra"). Applies to scripts written
 * without spaces (Japanese, Chinese, Korean): a run of 2 to {@link #MAX_RUN} regions consecutive in reading order,
 * each holding exactly one letter (punctuation aside), is sent joined under the first region's id. On the way back
 * the first region gets the translation and the others an ellipsis, so every balloon still carries something.
 */
public final class FragmentJoiner {
    static final int MAX_RUN = 3;
    static final String FOLLOWER_TEXT = "…";
    private static final Set<String> SOURCES = Set.of("ja", "zh-Hans", "zh-Hant", "ko");

    private final TranslationRequest original;
    private final TranslationRequest joined;
    /** First region id -> the following regions of its run. */
    private final Map<UUID, List<UUID>> followers;

    private FragmentJoiner(TranslationRequest original, TranslationRequest joined, Map<UUID, List<UUID>> followers) {
        this.original = original;
        this.joined = joined;
        this.followers = followers;
    }

    public static FragmentJoiner of(TranslationRequest request) {
        if (!SOURCES.contains(request.pair().source()) || request.regions().size() < 2) return new FragmentJoiner(request, request, Map.of());
        var ordered = request.regions().stream().sorted(Comparator.comparingInt(TranslationRequest.Region::readingOrder)).toList();
        var regions = new ArrayList<TranslationRequest.Region>(ordered.size());
        var followers = new HashMap<UUID, List<UUID>>();
        for (int i = 0; i < ordered.size(); ) {
            int end = i;
            while (end < ordered.size() && end - i < MAX_RUN && fragment(ordered.get(end).sourceText())
                && (end == i || ordered.get(end).readingOrder() == ordered.get(end - 1).readingOrder() + 1)) end++;
            if (end - i >= 2) {
                var first = ordered.get(i);
                var text = new StringBuilder();
                var rest = new ArrayList<UUID>();
                for (int k = i; k < end; k++) {
                    text.append(ordered.get(k).sourceText().strip());
                    if (k > i) rest.add(ordered.get(k).id());
                }
                regions.add(new TranslationRequest.Region(first.id(), first.readingOrder(), text.toString()));
                followers.put(first.id(), List.copyOf(rest));
                i = end;
            } else {
                regions.add(ordered.get(i));
                i++;
            }
        }
        if (followers.isEmpty()) return new FragmentJoiner(request, request, Map.of());
        return new FragmentJoiner(request, new TranslationRequest(request.jobRef(), request.pair(), regions), Map.copyOf(followers));
    }

    /** What the provider translates. */
    public TranslationRequest request() { return joined; }

    /** The provider's response mapped back onto every region of the original request. */
    public TranslationResponse expand(TranslationResponse response) {
        if (followers.isEmpty()) return response;
        var regions = new ArrayList<TranslationResponse.Region>(original.regions().size());
        for (var region : response.regions()) {
            regions.add(region);
            for (var follower : followers.getOrDefault(region.id(), List.of()))
                regions.add(new TranslationResponse.Region(follower, FOLLOWER_TEXT));
        }
        return new TranslationResponse(regions);
    }

    /** Exactly one letter, a CJK one, the rest punctuation or spaces: 「あ」, 「ら…」, 「え?」 (never "c" on a screen). */
    static boolean fragment(String text) {
        if (text == null || text.codePoints().anyMatch(Character::isDigit)) return false;
        int[] letters = text.codePoints().filter(Character::isLetter).toArray();
        return letters.length == 1 && switch (Character.UnicodeScript.of(letters[0])) {
            case HAN, HIRAGANA, KATAKANA, HANGUL -> true;
            default -> false;
        };
    }
}
