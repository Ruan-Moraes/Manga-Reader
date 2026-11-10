package com.toonlira.translationgateway.infrastructure.translation;

import com.google.api.gax.core.NoCredentialsProvider;
import com.google.cloud.translate.v3.TranslationServiceClient;
import com.google.cloud.translate.v3.TranslationServiceSettings;
import java.io.IOException;

/** Test-only endpoint/credential substitution; retains production retry/deadline settings. */
public final class VolatileLoopbackTranslationFactory extends TranslationClientFactory {
    private final int port;
    public VolatileLoopbackTranslationFactory(int port) { this.port = port; }
    @Override public TranslationServiceClient create() throws IOException {
        return TranslationServiceClient.create(settings().setEndpoint("127.0.0.1:" + port)
            .setCredentialsProvider(NoCredentialsProvider.create())
            .setTransportChannelProvider(TranslationServiceSettings.defaultGrpcTransportProviderBuilder()
                .setMaxInboundMessageSize(MAX_RESPONSE_BYTES)
                .setChannelConfigurator(channel -> configureChannel(channel).usePlaintext()).build()).build());
    }
}
