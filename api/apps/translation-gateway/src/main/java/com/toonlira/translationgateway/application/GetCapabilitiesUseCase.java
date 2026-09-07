package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.CAPABILITIES_UNAVAILABLE;

import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;

@Service
public class GetCapabilitiesUseCase {
    public static final List<String> LANGUAGES = List.of("ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR");
    public static final List<String> MIME_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    private static final Pattern GATEWAY_KEY = Pattern.compile("^[a-z0-9][a-z0-9-]{1,62}$");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final GatewayProperties properties;
    private final Clock clock;

    public GetCapabilitiesUseCase(GatewayProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public CapabilitiesView execute() {
        validateConfiguration();
        var now = Instant.now(clock);
        var disclosure = properties.getDisclosure();
        var pairs = LANGUAGES.stream()
            .flatMap(source -> LANGUAGES.stream().filter(target -> !source.equals(target))
                .map(target -> new CapabilitiesView.LanguagePair(source, target)))
            .toList();
        var media = properties.getMedia();
        var canonical = Stream.of(
            "1.0", properties.getKey(), Boolean.toString(properties.isEnabled()),
            String.join(",", LANGUAGES), String.join(",", MIME_TYPES),
            properties.getCapabilitiesTtl().toString(),
            Long.toString(media.getMaxBytes()), Integer.toString(media.getMaxWidthPx()),
            Integer.toString(media.getMaxHeightPx()), Long.toString(media.getMaxPixels()),
            Integer.toString(properties.getInstallationDailyQuota()), Integer.toString(properties.getGlobalDailyQuota()),
            disclosure.getVersion(), disclosure.getOperatorName(), disclosure.getOperatorContact(),
            disclosure.getPrivacyPolicyUrl(), disclosure.getTermsUrl(), disclosure.getProviderTrainingPolicy(),
            Integer.toString(disclosure.getOriginalRetentionSeconds()),
            Integer.toString(disclosure.getResultRetentionSeconds()),
            Integer.toString(disclosure.getMetadataRetentionDays()))
            .map(value -> value.length() + ":" + value)
            .collect(Collectors.joining());
        return new CapabilitiesView(
            "1.0", properties.getKey(), now, now.plus(properties.getCapabilitiesTtl()), properties.isEnabled(), LANGUAGES, pairs,
            new CapabilitiesView.MediaLimits(MIME_TYPES, properties.getMedia().getMaxBytes(), properties.getMedia().getMaxWidthPx(),
                properties.getMedia().getMaxHeightPx(), properties.getMedia().getMaxPixels()),
            properties.getInstallationDailyQuota(), properties.getGlobalDailyQuota(),
            new CapabilitiesView.LegalDisclosure(disclosure.getVersion(), disclosure.getOperatorName(), disclosure.getOperatorContact(),
                disclosure.getPrivacyPolicyUrl(), disclosure.getTermsUrl(), "southamerica-east1", List.of("us", "us-central1"),
                disclosure.getOriginalRetentionSeconds(), disclosure.getResultRetentionSeconds(), disclosure.getMetadataRetentionDays(),
                disclosure.getProviderTrainingPolicy()),
            "W/\"" + sha256(canonical) + '"'
        );
    }

    public void requireEnabled() {
        var capabilities = execute();
        if (!capabilities.enabled()) throw new GatewayException(com.toonlira.translationgateway.domain.GatewayErrorCode.GATEWAY_DISABLED, 503, true);
    }

    private boolean validOperationalConfiguration() {
        var dispatchMode = properties.getDispatch().getMode();
        if ("local-ack".equals(dispatchMode)) return true;
        var dispatch = properties.getDispatch();
        var storage = properties.getStorage();
        return "cloud-tasks".equals(dispatchMode)
            && "gcs".equals(storage.getMode()) && !storage.getBucket().isBlank()
            && !dispatch.getProjectId().isBlank() && !dispatch.getLocation().isBlank() && !dispatch.getQueue().isBlank()
            && isHttps(dispatch.getWorkerUrl()) && EMAIL.matcher(dispatch.getServiceAccountEmail()).matches();
    }

    private void validateConfiguration() {
        var disclosure = properties.getDisclosure();
        boolean valid = GATEWAY_KEY.matcher(properties.getKey()).matches()
            && positiveDurations()
            && properties.getInstallationDailyQuota() == 20
            && properties.getGlobalDailyQuota() == 100
            && !disclosure.getVersion().isBlank() && disclosure.getVersion().length() <= 64
            && !disclosure.getOperatorName().isBlank() && disclosure.getOperatorName().length() <= 160
            && EMAIL.matcher(disclosure.getOperatorContact()).matches()
            && isHttps(disclosure.getPrivacyPolicyUrl())
            && isHttps(disclosure.getTermsUrl())
            && !disclosure.getProviderTrainingPolicy().isBlank() && disclosure.getProviderTrainingPolicy().length() <= 500
            && disclosure.getOriginalRetentionSeconds() > 0 && disclosure.getOriginalRetentionSeconds() <= 3600
            && disclosure.getResultRetentionSeconds() > 0 && disclosure.getResultRetentionSeconds() <= 3600
            && disclosure.getMetadataRetentionDays() > 0 && disclosure.getMetadataRetentionDays() <= 7
            && (!properties.isEnabled() || validOperationalConfiguration());
        if (!valid) throw new GatewayException(CAPABILITIES_UNAVAILABLE, 503, true);
    }

    private boolean positiveDurations() {
        var media = properties.getMedia();
        return !properties.getSessionTtl().isNegative() && !properties.getSessionTtl().isZero()
            && !properties.getCapabilitiesTtl().isNegative() && !properties.getCapabilitiesTtl().isZero()
            && properties.getCapabilitiesTtl().compareTo(Duration.ofMinutes(5)) <= 0
            && media.getMaxBytes() > 0 && media.getMaxWidthPx() > 0 && media.getMaxHeightPx() > 0 && media.getMaxPixels() > 0;
    }

    private boolean isHttps(String value) {
        try {
            var uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null && !uri.getHost().isBlank();
        } catch (IllegalArgumentException error) {
            return false;
        }
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
