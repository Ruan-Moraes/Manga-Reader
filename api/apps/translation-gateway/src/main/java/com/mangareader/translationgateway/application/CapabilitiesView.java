package com.mangareader.translationgateway.application;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Instant;
import java.util.List;

public record CapabilitiesView(
    String contractVersion,
    String gatewayKey,
    Instant generatedAt,
    Instant validUntil,
    boolean enabled,
    List<String> supportedLanguages,
    List<LanguagePair> supportedPairs,
    MediaLimits mediaLimits,
    int dailyInstallationQuota,
    int dailyGlobalQuota,
    LegalDisclosure disclosure,
    @JsonIgnore String etag
) {
    public record LanguagePair(String source, String target) { }
    public record MediaLimits(List<String> mimeTypes, long maxBytes, int maxWidthPx, int maxHeightPx, long maxPixels) { }
    public record LegalDisclosure(
        String version,
        String operatorName,
        String operatorContact,
        String privacyPolicyUrl,
        String termsUrl,
        String gatewayRegion,
        List<String> processingRegions,
        int originalRetentionSeconds,
        int resultRetentionSeconds,
        int metadataRetentionDays,
        String providerTrainingPolicy
    ) { }
}
