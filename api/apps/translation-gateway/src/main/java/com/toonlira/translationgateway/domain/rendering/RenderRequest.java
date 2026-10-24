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
    }

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
