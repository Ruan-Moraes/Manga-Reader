package com.toonlira.translationgateway.infrastructure.ocr;

import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import com.toonlira.translationgateway.domain.OcrLimits;
import com.google.api.gax.core.InstantiatingExecutorProvider;
import io.grpc.ManagedChannelBuilder;
import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.concurrent.TimeUnit;

public class VisionClientFactory {
    public static final String ENDPOINT = "us-vision.googleapis.com:443";
    public static final Duration DEADLINE = Duration.ofSeconds(60);
    static final Duration IDLE = Duration.ofMinutes(2), KEEPALIVE = Duration.ofSeconds(60), KEEPALIVE_TIMEOUT = Duration.ofSeconds(20);

    public ImageAnnotatorClient create() throws IOException {
        return ImageAnnotatorClient.create(settings().build());
    }

    static ImageAnnotatorSettings.Builder settings() {
        var settings = ImageAnnotatorSettings.newBuilder().setEndpoint(ENDPOINT)
            .setExecutorProvider(InstantiatingExecutorProvider.newBuilder().setExecutorThreadCount(2).build())
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

    /**
     * Retries stay off (no double billing), so a connection silently dropped while the worker sat idle must never be
     * reused: after {@link #IDLE} without calls the channel closes its connection and opens a fresh one on the next
     * call, and keepalive pings during a call detect a connection that dies mid-request. Seen locally: after ~6 min
     * idle every OCR call waited the whole 60 s deadline on a dead connection ({@code ocr-unavailable}).
     */
    static ManagedChannelBuilder<?> configureChannel(ManagedChannelBuilder<?> channel) {
        return channel.disableRetry().maxInboundMessageSize(OcrLimits.MAX_RESPONSE_BYTES)
            .idleTimeout(IDLE.toSeconds(), TimeUnit.SECONDS)
            .keepAliveTime(KEEPALIVE.toSeconds(), TimeUnit.SECONDS)
            .keepAliveTimeout(KEEPALIVE_TIMEOUT.toSeconds(), TimeUnit.SECONDS);
    }
}
