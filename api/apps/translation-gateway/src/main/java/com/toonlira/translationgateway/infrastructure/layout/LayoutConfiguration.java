package com.toonlira.translationgateway.infrastructure.layout;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutFailure;
import com.toonlira.translationgateway.domain.layout.LayoutManifest;
import com.toonlira.translationgateway.domain.layout.ReadingDirection;
import java.nio.file.Path;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

@Configuration(proxyBeanMethods = false)
public class LayoutConfiguration {
    @Bean
    LayoutPort layoutPort(GatewayProperties properties, Environment environment) {
        var config = properties.getLayout();
        if (config.getMode() == GatewayProperties.Layout.Mode.DISABLED) return disabled();
        if (!environment.acceptsProfiles(Profiles.of("worker")))
            throw new IllegalStateException("Shadow layout requires worker profile");
        ReadingDirection direction;
        try { direction = ReadingDirection.valueOf(config.getDirection()); }
        catch (RuntimeException error) { throw new IllegalStateException("Shadow layout requires ltr or rtl direction"); }
        return new LocalLayoutAdapter(new OnnxBubbleDetector(config.getModelPath()), direction, Duration.ofSeconds(30));
    }

    public static LayoutPort disabled() {
        return new LayoutPort() {
            public boolean available() { return false; }
            public LayoutManifest analyze(Path image, OcrManifest ocr, String imageHash, String ocrHash) {
                throw new LayoutFailure(LayoutFailure.Code.UNAVAILABLE);
            }
        };
    }
}
