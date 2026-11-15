package com.toonlira.translationgateway.presentation;

import com.toonlira.translationgateway.application.VolatileGatewayPolicy;
import com.toonlira.translationgateway.application.config.ConfiguredTranslationPairs;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.SupportedLanguages;
import java.util.List;
import java.time.Clock;
import java.time.Instant;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("!worker")
public class VolatileCapabilitiesController {
    private final GatewayProperties properties;
    private final Clock clock;
    public VolatileCapabilitiesController(GatewayProperties properties, Clock clock) { this.properties = properties; this.clock = clock; }
    @GetMapping("/v2/capabilities")
    public ResponseEntity<Capabilities> capabilities(@RequestParam(name = "quotaView", defaultValue = "legacy") String quotaView) {
        VolatileGatewayPolicy.validate(properties);
        boolean unmetered = properties.getTestBudget().isUnmetered();
        boolean effectiveQuotaView = "effective".equals(quotaView);
        int installationQuota = unmetered ? (effectiveQuotaView ? 0 : 20) : properties.getInstallationDailyQuota();
        int globalQuota = unmetered && effectiveQuotaView ? 0 : properties.getGlobalDailyQuota();
        var disclosure = properties.getDisclosure();
        var pairs = ConfiguredTranslationPairs.parse(properties.getTranslation().getEnabledPairs()).stream()
            .sorted(java.util.Comparator.comparing(LanguagePair::source).thenComparing(LanguagePair::target)).toList();
        var media = properties.getMedia();
        var now = Instant.now(clock);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new Capabilities("2.0", properties.getKey(),
            now, now.plus(properties.getCapabilitiesTtl()),
            properties.isEnabled() && properties.isVolatileProcessingEnabled(), "volatile-direct-response", SupportedLanguages.CODES,
            pairs, new Limits(List.of("image/jpeg", "image/png", "image/webp"), Math.min(media.getMaxBytes(), RenderPolicy.MAX_ORIGINAL_BYTES),
                Math.min(media.getMaxWidthPx(), RenderPolicy.MAX_DIMENSION_PX), Math.min(media.getMaxHeightPx(), RenderPolicy.MAX_DIMENSION_PX),
                Math.min(media.getMaxPixels(), RenderPolicy.MAX_PIXELS), RenderPolicy.MAX_OUTPUT_BYTES, RenderPolicy.MAX_MANIFEST_BYTES),
            installationQuota, globalQuota,
            new Disclosure(disclosure.getVersion(), disclosure.getOperatorName(), disclosure.getOperatorContact(),
                disclosure.getTermsUrl(), disclosure.getPrivacyPolicyUrl(), "southamerica-east1", "us", "global",
                "in-memory-only", "user-device", true, "uuid-v7", 604800, disclosure.getProviderTrainingPolicy())));
    }
    public record Limits(List<String> mimeTypes, long maxBytes, int maxWidthPx, int maxHeightPx, long maxPixels, long maxResultBytes, int maxManifestBytes) { }
    public record Disclosure(String version, String operatorName, String operatorContact, String termsUrl, String privacyPolicyUrl,
                             String gatewayRegion, String ocrRegion, String translationLocation, String contentProcessing,
                             String resultStorage, boolean sanitizedOperationalLogs, String idempotencyKeyFormat,
                             int receiptValiditySeconds, String providerTrainingPolicy) { }
    public record Capabilities(String contractVersion, String gatewayKey, Instant generatedAt, Instant validUntil, boolean enabled, String transport,
                               List<String> supportedLanguages, List<LanguagePair> supportedPairs, Limits mediaLimits,
                               int dailyInstallationQuota, int dailyGlobalQuota, Disclosure disclosure) { }
}
