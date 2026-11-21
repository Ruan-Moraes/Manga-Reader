package com.toonlira.translationgateway.infrastructure.rendering;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class PageRasterConfiguration {
    /** JDK formats only: untrusted WebP is decoded by the render child, never in the API process. */
    @Bean
    PageRasterReader pageRasterReader() { return PageRasterReader.jdkOnly(); }
}
