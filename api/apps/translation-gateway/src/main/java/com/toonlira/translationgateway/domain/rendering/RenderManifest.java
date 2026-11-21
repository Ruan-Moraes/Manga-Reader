package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_OUTPUT;

import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

/** Private, ephemeral fallback artifact. Source and translation remain complete and unmodified. */
public final class RenderManifest {
    /** 1.2 (2026-11-19): {@code terms}, the chapter names the page used, written by RenderManifestService. */
    public static final String VERSION = "1.2";
    private final RenderRequest request;
    private final RenderedImage image;
    private final List<Region> regions;

    private RenderManifest(RenderRequest request, RenderedImage image, List<Region> regions) {
        this.request = request;
        this.image = image;
        this.regions = List.copyOf(regions);
    }

    public static RenderManifest create(RenderRequest request, RenderedImage image, List<Placement> placements) {
        if (request == null || image == null || placements == null
            || placements.size() != request.regions().size()
            || image.widthPx() != request.source().widthPx() || image.heightPx() != request.source().heightPx()
            || image.byteSize() > request.policy().maxOutputBytes()) invalid();
        var byId = new HashMap<UUID, Placement>();
        for (var placement : placements) {
            if (byId.size() >= request.regions().size() || placement == null || placement.regionId() == null
                || !validFont(placement, request.policy())
                || byId.putIfAbsent(placement.regionId(), placement) != null) invalid();
        }
        var regions = request.regions().stream().map(region -> {
            var placement = byId.get(region.id());
            if (placement == null) invalid();
            return new Region(region.id(), region.readingOrder(), region.sourceText(), region.translatedText(),
                region.polygon(), placement.overflow(), placement.fontSizePx(), placement.kept());
        }).toList();
        return new RenderManifest(request, image, regions);
    }

    private static boolean validFont(Placement placement, RenderPolicy policy) {
        if (placement.kept() && !placement.overflow()) return false;
        return placement.overflow() ? placement.fontSizePx() == 0
            : placement.fontSizePx() >= policy.minimumFontPx() && placement.fontSizePx() <= policy.largestFontPx();
    }

    private static void invalid() { throw new RenderValidationException(INVALID_OUTPUT); }

    public String version() { return VERSION; }
    public String policyVersion() { return request.policy().version(); }
    public UUID jobRef() { return request.jobRef(); }
    public String sourceLanguage() { return request.pair().source(); }
    public String targetLanguage() { return request.pair().target(); }
    public String originalSha256() { return request.source().sha256(); }
    public String ocrSha256() { return request.ocrSha256(); }
    public String translationSha256() { return request.translationSha256(); }
    public RenderedImage image() { return image; }
    public List<Region> regions() { return regions; }
    public PageQuality quality() { return PageQuality.evaluate(regions, image.widthPx(), image.heightPx()); }
    @Override public String toString() { return "RenderManifest[redacted]"; }

    /**
     * {@code overflow}: the original stays (nothing drawn). {@code kept}: it stays on purpose — drawn text that is not
     * speech (sound effects, screens, signs) — so it is not text left to review.
     */
    public record Placement(UUID regionId, boolean overflow, int fontSizePx, boolean kept) {
        public Placement(UUID regionId, boolean overflow, int fontSizePx) { this(regionId, overflow, fontSizePx, false); }
        @Override public String toString() { return "RenderManifest.Placement[redacted]"; }
    }

    public record Region(UUID id, int readingOrder, String sourceText, String translatedText,
                         List<OcrManifest.Vertex> polygon, boolean overflow, int fontSizePx, boolean kept) {
        public Region { polygon = List.copyOf(polygon); }
        @Override public String toString() { return "RenderManifest.Region[redacted]"; }
    }
}
