package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.RenderPort;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("worker")
@ConditionalOnProperty(name = "gateway.rendering.mode", havingValue = "local")
public class RenderingConfiguration {
    @Bean
    @ConditionalOnMissingBean(RenderPort.class)
    RenderPort renderPort(GatewayProperties properties) {
        try {
            var configuration = properties.getRendering();
            var directory = configuration.getTemporaryDirectory();
            if (directory == null || !directory.isAbsolute() || !Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS)
                || !Files.isWritable(directory)) throw new IllegalStateException();
            var codec = new WebpProcessCodec(configuration.getEncoderPath(), configuration.getEncoderSha256(),
                configuration.getDecoderPath(), configuration.getDecoderSha256(), configuration.getNativeTimeout());
            return new LocalFileRenderAdapter(codec, new PageRasterPainter(new BundledRenderingFonts()), directory.toRealPath());
        } catch (Exception error) {
            // No cause: paths, parser details and native output must not escape initialization.
            throw new IllegalStateException("Renderer preparation unavailable");
        }
    }
}
