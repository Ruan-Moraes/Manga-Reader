package com.toonlira.translationgateway.infrastructure.ocr;

import com.google.api.gax.core.NoCredentialsProvider;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import com.toonlira.translationgateway.domain.OcrLimits;
import java.io.IOException;

/** Test-only endpoint/credential substitution; retains production retry/deadline settings. */
public final class VolatileLoopbackVisionFactory extends VisionClientFactory {
    private final int port;
    public VolatileLoopbackVisionFactory(int port) { this.port = port; }
    @Override public ImageAnnotatorClient create() throws IOException {
        return ImageAnnotatorClient.create(settings().setEndpoint("127.0.0.1:" + port)
            .setCredentialsProvider(NoCredentialsProvider.create())
            .setTransportChannelProvider(ImageAnnotatorSettings.defaultGrpcTransportProviderBuilder()
                .setMaxInboundMessageSize(OcrLimits.MAX_RESPONSE_BYTES)
                .setChannelConfigurator(channel -> configureChannel(channel).usePlaintext()).build()).build());
    }
}
