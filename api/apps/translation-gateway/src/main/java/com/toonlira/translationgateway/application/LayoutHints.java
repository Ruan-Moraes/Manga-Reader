package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.layout.LayoutParameters;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * What the layout artifact tells the later stages: balloon boxes and the detector class of each OCR region
 * ("text_bubble", "text_free" or "unknown"). Best effort: a missing, unreadable or foreign artifact gives no hints
 * and never fails a stage.
 */
public record LayoutHints(List<LayoutBox> bubbles, Map<UUID, String> kinds) {
    public static final LayoutHints NONE = new LayoutHints(List.of(), Map.of());
    static final Set<String> KINDS = Set.of("text_bubble", "text_free", "unknown");
    private static final int MAX_BUBBLES = 256;
    private static final tools.jackson.databind.ObjectMapper JSON = new tools.jackson.databind.ObjectMapper();

    public LayoutHints {
        bubbles = List.copyOf(bubbles);
        kinds = Map.copyOf(kinds);
    }

    /**
     * The hints of the artifact stored under {@code key}, only when its bytes hash to {@code sha256} and it
     * describes this very OCR manifest (and this image, when {@code imageSha256} is given).
     */
    public static LayoutHints read(ObjectStoragePort storage, String key, String sha256, String imageSha256, String ocrSha256) {
        if (key == null || key.isBlank() || sha256 == null || !sha256.matches("[0-9a-f]{64}") || ocrSha256 == null) return NONE;
        try {
            byte[] bytes;
            try (var input = storage.open(key)) { bytes = input.readNBytes(LayoutParameters.MAX_BYTES + 1); }
            if (bytes.length == 0 || bytes.length > LayoutParameters.MAX_BYTES
                || !MessageDigest.isEqual(MessageDigest.getInstance("SHA-256").digest(bytes), HexFormat.of().parseHex(sha256))) return NONE;
            var root = JSON.readTree(bytes);
            if (imageSha256 != null && !imageSha256.equals(root.path("imageSha256").asText())) return NONE;
            if (!ocrSha256.equals(root.path("ocrManifestSha256").asText())) return NONE;
            var boxes = new ArrayList<LayoutBox>();
            for (var bubble : root.path("bubbles")) {
                var b = bubble.path("bounds");
                boxes.add(new LayoutBox(b.path("left").asDouble(), b.path("top").asDouble(), b.path("right").asDouble(),
                    b.path("bottom").asDouble()));
                if (boxes.size() > MAX_BUBBLES) return NONE;
            }
            var kinds = new HashMap<UUID, String>();
            for (var kind : root.path("regionKinds")) {
                var value = kind.path("kind").asText();
                if (!KINDS.contains(value)) return NONE;
                kinds.put(UUID.fromString(kind.path("regionId").asText()), value);
            }
            return new LayoutHints(boxes, kinds);
        } catch (RuntimeException | IOException | NoSuchAlgorithmException unusable) {
            return NONE;
        }
    }
}
