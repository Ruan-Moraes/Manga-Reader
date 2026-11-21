package com.toonlira.translationgateway.infrastructure.ocr;

import com.google.api.gax.rpc.ApiException;
import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.BatchAnnotateImagesRequest;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageContext;
import com.google.protobuf.ByteString;
import com.toonlira.translationgateway.application.port.InlineOcrPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrParagraph;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.util.List;
import java.util.UUID;

public final class VisionOcrAdapter implements InlineOcrPort, AutoCloseable {
    /** Inline mosaics stay well under the provider's request size limit. */
    static final int MAX_INLINE_BYTES = 8 * 1024 * 1024;
    private final ImageAnnotatorClient client;
    private final String projectId;
    private final VisionResponseMapper mapper = new VisionResponseMapper();

    public VisionOcrAdapter(ImageAnnotatorClient client, String projectId) {
        this.client = client;
        this.projectId = projectId;
    }

    @Override
    public List<OcrManifest.Region> recognize(byte[] bytes, String sourceLanguage, UUID operationRef, int widthPx, int heightPx) {
        return recognizeParagraphs(bytes, sourceLanguage, operationRef, widthPx, heightPx).stream().map(OcrParagraph::region).toList();
    }

    @Override
    public List<OcrParagraph> recognizeParagraphs(byte[] bytes, String sourceLanguage, UUID operationRef, int widthPx, int heightPx) {
        if (bytes == null || bytes.length == 0 || bytes.length > RenderPolicy.MAX_ORIGINAL_BYTES
            || operationRef == null || widthPx <= 0 || heightPx <= 0
            || widthPx > RenderPolicy.MAX_DIMENSION_PX || heightPx > RenderPolicy.MAX_DIMENSION_PX
            || (long) widthPx * heightPx > RenderPolicy.MAX_PIXELS) {
            throw new GatewayException(GatewayErrorCode.OCR_INVALID_MEDIA, 422, false);
        }
        return annotate(bytes, languageHint(sourceLanguage), new VisionResponseMapper.Context(operationRef, widthPx, heightPx));
    }

    /** Re-read mosaic: same provider, region and feature as the page; sent inline, never stored. */
    @Override
    public List<OcrParagraph> recognizeImage(byte[] png, String sourceLanguage, int widthPx, int heightPx) {
        if (png == null || png.length == 0 || png.length > MAX_INLINE_BYTES || widthPx <= 0 || heightPx <= 0)
            throw new GatewayException(GatewayErrorCode.OCR_INVALID_MEDIA, 422, false);
        return annotate(png, languageHint(sourceLanguage), new VisionResponseMapper.Context(UUID.randomUUID(), widthPx, heightPx));
    }

    private List<OcrParagraph> annotate(byte[] bytes, String hint, VisionResponseMapper.Context context) {
        var request = BatchAnnotateImagesRequest.newBuilder().setParent("projects/" + projectId + "/locations/us")
            .addRequests(AnnotateImageRequest.newBuilder().setImage(Image.newBuilder().setContent(ByteString.copyFrom(bytes)))
                .addFeatures(Feature.newBuilder().setType(Feature.Type.DOCUMENT_TEXT_DETECTION))
                .setImageContext(ImageContext.newBuilder().addLanguageHints(hint))).build();
        try {
            return mapper.mapParagraphs(client.batchAnnotateImages(request), context);
        } catch (ApiException error) {
            // Provider messages can contain text or object references; never retain the cause.
            throw new GatewayException(GatewayErrorCode.OCR_UNAVAILABLE, 503, false);
        }
    }

    static String languageHint(String sourceLanguage) {
        if (sourceLanguage == null) throw new GatewayException(GatewayErrorCode.OCR_INVALID_MEDIA, 422, false);
        return switch (sourceLanguage) {
            case "ja", "en", "es", "ko", "zh-Hans", "zh-Hant" -> sourceLanguage;
            case "pt-BR" -> "pt";
            default -> throw new GatewayException(GatewayErrorCode.OCR_INVALID_MEDIA, 422, false);
        };
    }

    @Override
    public void close() { client.close(); }
}
