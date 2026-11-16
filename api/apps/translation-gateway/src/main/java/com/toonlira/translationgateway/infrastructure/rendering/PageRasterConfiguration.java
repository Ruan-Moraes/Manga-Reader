package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class PageRasterConfiguration {
    /** WebP pages are read through the renderer's pinned codec when one is configured; otherwise JDK formats only. */
    @Bean
    PageRasterReader pageRasterReader(GatewayProperties properties) {
        var rendering = properties.getRendering();
        if (rendering.getDecoderPath() == null || rendering.getEncoderPath() == null) return PageRasterReader.jdkOnly();
        try {
            return new PageRasterReader(new WebpProcessCodec(rendering.getEncoderPath(), rendering.getEncoderSha256(),
                rendering.getDecoderPath(), rendering.getDecoderSha256(), rendering.getNativeTimeout()));
        } catch (RuntimeException unavailable) {
            return PageRasterReader.jdkOnly();
        }
    }
}
