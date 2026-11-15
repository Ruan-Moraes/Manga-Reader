package com.toonlira.translationgateway.infrastructure.ocr;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class OcrConfiguration {
    @Bean
    @ConditionalOnMissingBean(VisionClientFactory.class)
    VisionClientFactory visionClientFactory() { return new VisionClientFactory(); }
}
