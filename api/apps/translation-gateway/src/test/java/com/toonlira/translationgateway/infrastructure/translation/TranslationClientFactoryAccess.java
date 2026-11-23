package com.toonlira.translationgateway.infrastructure.translation;

import io.grpc.ManagedChannelBuilder;

/** Test access to the package-private channel configurator. */
public final class TranslationClientFactoryAccess {
    private TranslationClientFactoryAccess() { }

    public static ManagedChannelBuilder<?> configure(ManagedChannelBuilder<?> channel) {
        return TranslationClientFactory.configureChannel(channel);
    }
}
