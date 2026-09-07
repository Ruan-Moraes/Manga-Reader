package com.toonlira.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.brand")
public record BrandProperties(
        String name,
        String shortName,
        String slug,
        String description,
        String tagline,
        String publicUrl,
        String apiUrl,
        String supportEmail,
        String adminEmail,
        String emailIdentity) {
}
