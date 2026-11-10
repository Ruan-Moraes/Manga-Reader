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
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.util.List;
import java.util.UUID;

public final class VisionOcrAdapter implements InlineOcrPort, AutoCloseable {
    private final ImageAnnotatorClient client;
    private final String projectId;
    private final VisionResponseMapper mapper = new VisionResponseMapper();

    public VisionOcrAdapter(ImageAnnotatorClient client, String projectId) {
        this.client = client;
        this.projectId = projectId;
    }

    @Override
    public List<OcrManifest.Region> recognize(byte[] bytes, String sourceLanguage, UUID operationRef, int widthPx, int heightPx) {
        if (bytes == null || bytes.length == 0 || bytes.length > RenderPolicy.MAX_ORIGINAL_BYTES
            || operationRef == null || widthPx <= 0 || heightPx <= 0
            || widthPx > RenderPolicy.MAX_DIMENSION_PX || heightPx > RenderPolicy.MAX_DIMENSION_PX
            || (long) widthPx * heightPx > RenderPolicy.MAX_PIXELS) {
            throw new GatewayException(GatewayErrorCode.OCR_INVALID_MEDIA, 422, false);
        }
        var context = new VisionResponseMapper.Context(operationRef, widthPx, heightPx);
        var request = BatchAnnotateImagesRequest.newBuilder().setParent("projects/" + projectId + "/locations/us")
            .addRequests(AnnotateImageRequest.newBuilder().setImage(Image.newBuilder().setContent(ByteString.copyFrom(bytes)))
                .addFeatures(Feature.newBuilder().setType(Feature.Type.DOCUMENT_TEXT_DETECTION))
                .setImageContext(ImageContext.newBuilder().addLanguageHints(languageHint(sourceLanguage)))).build();
        try { return mapper.map(client.batchAnnotateImages(request), context); }
        catch (ApiException error) { throw new GatewayException(GatewayErrorCode.OCR_UNAVAILABLE, 503, false); }
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
