package com.toonlira.translationgateway.infrastructure.translation;

import com.google.cloud.translate.v3.TranslationServiceClient;
import com.google.cloud.translate.v3.TranslationServiceSettings;
import io.grpc.ManagedChannelBuilder;
import java.io.IOException;
import java.time.Duration;
import java.util.Set;

public class TranslationClientFactory {
    static final Duration DEADLINE = Duration.ofSeconds(60);
    static final int MAX_RESPONSE_BYTES = 4 * 1024 * 1024;

    public TranslationServiceClient create() throws IOException {
        return TranslationServiceClient.create(settings().build());
    }

    static TranslationServiceSettings.Builder settings() {
        var settings = TranslationServiceSettings.newBuilder().setEndpoint(CloudTranslationAdapter.ENDPOINT)
            .setTransportChannelProvider(TranslationServiceSettings.defaultGrpcTransportProviderBuilder()
                .setMaxInboundMessageSize(MAX_RESPONSE_BYTES)
                .setChannelConfigurator(TranslationClientFactory::configureChannel).build());
        var call = settings.translateTextSettings();
        call.setRetryableCodes(Set.of());
        call.setRetrySettings(call.getRetrySettings().toBuilder().setMaxAttempts(1)
            .setInitialRpcTimeoutDuration(DEADLINE).setMaxRpcTimeoutDuration(DEADLINE)
            .setTotalTimeoutDuration(DEADLINE).setRpcTimeoutMultiplier(1).build());
        return settings;
    }

    static ManagedChannelBuilder<?> configureChannel(ManagedChannelBuilder<?> channel) {
        return channel.disableRetry().maxInboundMessageSize(MAX_RESPONSE_BYTES);
    }
}
