package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.net.URI;
import java.time.Duration;

public final class VolatileGatewayPolicy {
    /**
     * Volatile disclosures whose published privacy text names the language layer (Gemini on Vertex AI: text only,
     * never the image; cache and training policy) and the chapter memory (names kept by the gateway for the chapter's
     * next pages, up to the disclosed retention). The language layer runs only under one of them.
     */
    public static final java.util.Set<String> LANGUAGE_MODEL_DISCLOSURE_VERSIONS = java.util.Set.of("volatile-2026-11-21.v1");
    private static final java.util.regex.Pattern LANGUAGE_MODEL_LOCATION = java.util.regex.Pattern.compile("^[a-z][a-z0-9-]{0,28}[a-z0-9]$");
    private VolatileGatewayPolicy() { }

    /** Disclosed only while the gateway would actually send text to the model: translation on and the review on. */
    public static String languageModelLocation(GatewayProperties properties) {
        var translation = properties.getTranslation();
        if (translation.getMode() == GatewayProperties.Translation.Mode.DISABLED
            || translation.getRefine().getMode() == GatewayProperties.Translation.Refine.Mode.DISABLED) return null;
        return translation.getRefine().getLocation();
    }
    public static void validate(GatewayProperties properties) {
        var disclosure = properties.getDisclosure();
        var testBudget = properties.getTestBudget();
        boolean valid = properties.getKey().matches("[a-z0-9][a-z0-9-]{1,62}")
            && disclosure.getVersion().matches("volatile-[A-Za-z0-9._-]{1,55}")
            && !disclosure.getOperatorName().isBlank() && disclosure.getOperatorName().length() <= 160
            && disclosure.getOperatorContact().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")
            && https(disclosure.getTermsUrl()) && https(disclosure.getPrivacyPolicyUrl())
            && !disclosure.getProviderTrainingPolicy().isBlank() && disclosure.getProviderTrainingPolicy().length() <= 500
            && properties.getSessionTtl().isPositive() && properties.getSessionTtl().compareTo(Duration.ofMinutes(15)) <= 0
            && properties.getCapabilitiesTtl().isPositive() && properties.getCapabilitiesTtl().compareTo(Duration.ofMinutes(5)) <= 0
            && properties.getGlobalDailyQuota() == 100
            && (properties.getInstallationDailyQuota() == 20
                || (properties.getInstallationDailyQuota() == 0 && testBudget.isEnabled()))
            && (!testBudget.isUnmetered() || (testBudget.isEnabled() && testBudget.getDeadline() != null))
            && (languageModelLocation(properties) == null
                || LANGUAGE_MODEL_LOCATION.matcher(languageModelLocation(properties)).matches()
                    && LANGUAGE_MODEL_DISCLOSURE_VERSIONS.contains(disclosure.getVersion()));
        if (!valid) throw new GatewayException(GatewayErrorCode.CAPABILITIES_UNAVAILABLE, 503, false);
    }
    private static boolean https(String value) {
        try {
            var uri = URI.create(value);
            return "https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null && uri.getFragment() == null;
        } catch (IllegalArgumentException error) { return false; }
    }
}
