package com.toonlira.translationgateway.infrastructure.ocr;

import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import io.grpc.ManagedChannelBuilder;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

/** A connection dropped while the worker sits idle is never reused: idle timeout and keepalive on provider channels. */
class ProviderChannelHygieneTest {
    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void visionAndTranslationChannelsDropIdleConnectionsAndDetectDeadOnes() {
        ManagedChannelBuilder vision = mock(ManagedChannelBuilder.class, RETURNS_SELF);
        VisionClientFactory.configureChannel(vision);
        verify(vision).idleTimeout(120, TimeUnit.SECONDS);
        verify(vision).keepAliveTime(60, TimeUnit.SECONDS);
        verify(vision).keepAliveTimeout(20, TimeUnit.SECONDS);
        verify(vision).disableRetry();

        ManagedChannelBuilder translation = mock(ManagedChannelBuilder.class, RETURNS_SELF);
        com.toonlira.translationgateway.infrastructure.translation.TranslationClientFactoryAccess.configure(translation);
        verify(translation).idleTimeout(2, TimeUnit.MINUTES);
        verify(translation).keepAliveTime(60, TimeUnit.SECONDS);
        verify(translation).keepAliveTimeout(20, TimeUnit.SECONDS);
        verify(translation).disableRetry();
    }
}
