package com.toonlira.translationgateway.infrastructure.ocr;

import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import com.toonlira.translationgateway.domain.OcrLimits;
import io.grpc.ManagedChannelBuilder;
import java.io.IOException;
import java.time.Duration;
import java.util.Set;

public class VisionClientFactory {
    public static final String ENDPOINT = "us-vision.googleapis.com:443";
    public static final Duration DEADLINE = Duration.ofSeconds(60);

    public ImageAnnotatorClient create() throws IOException {
        return ImageAnnotatorClient.create(settings().build());
    }

    static ImageAnnotatorSettings.Builder settings() {
        var settings = ImageAnnotatorSettings.newBuilder().setEndpoint(ENDPOINT)
            .setTransportChannelProvider(ImageAnnotatorSettings.defaultGrpcTransportProviderBuilder()
                .setMaxInboundMessageSize(OcrLimits.MAX_RESPONSE_BYTES)
                .setChannelConfigurator(VisionClientFactory::configureChannel).build());
        var call = settings.batchAnnotateImagesSettings();
        call.setRetryableCodes(Set.of());
        call.setRetrySettings(call.getRetrySettings().toBuilder().setMaxAttempts(1)
            .setInitialRpcTimeoutDuration(DEADLINE).setMaxRpcTimeoutDuration(DEADLINE)
            .setTotalTimeoutDuration(DEADLINE).setRpcTimeoutMultiplier(1).build());
        return settings;
    }

    static ManagedChannelBuilder<?> configureChannel(ManagedChannelBuilder<?> channel) {
        return channel.disableRetry().maxInboundMessageSize(OcrLimits.MAX_RESPONSE_BYTES);
    }
}
