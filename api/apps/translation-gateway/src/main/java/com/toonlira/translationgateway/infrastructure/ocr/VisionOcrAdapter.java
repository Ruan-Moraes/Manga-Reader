package com.toonlira.translationgateway.infrastructure.ocr;

import com.google.api.gax.rpc.ApiException;
import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.BatchAnnotateImagesRequest;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageContext;
import com.google.cloud.vision.v1.ImageSource;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;

public final class VisionOcrAdapter implements OcrPort, AutoCloseable {
    private final ImageAnnotatorClient client;
    private final String projectId;
    private final String bucket;
    private final VisionResponseMapper mapper = new VisionResponseMapper();

    public VisionOcrAdapter(ImageAnnotatorClient client, String projectId, String bucket) {
        this.client = client;
        this.projectId = projectId;
        this.bucket = bucket;
    }

    @Override
    public boolean available() { return true; }

    @Override
    public List<OcrManifest.Region> recognize(Command command) {
        var hint = languageHint(command.sourceLanguage());
        if (command.jobRef() == null || command.widthPx() <= 0 || command.heightPx() <= 0
            || command.objectKey() == null || !command.objectKey().matches("private/originals/[A-Za-z0-9/_\\.-]+")
            || command.objectKey().contains("..")) {
            throw new GatewayException(GatewayErrorCode.OCR_INVALID_MEDIA, 422, false);
        }
        var image = Image.newBuilder().setSource(ImageSource.newBuilder()
            .setGcsImageUri("gs://" + bucket + "/" + command.objectKey()));
        var request = BatchAnnotateImagesRequest.newBuilder().setParent("projects/" + projectId + "/locations/us")
            .addRequests(AnnotateImageRequest.newBuilder().setImage(image)
                .addFeatures(Feature.newBuilder().setType(Feature.Type.DOCUMENT_TEXT_DETECTION))
                .setImageContext(ImageContext.newBuilder().addLanguageHints(hint))).build();
        try {
            return mapper.map(client.batchAnnotateImages(request), command);
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
