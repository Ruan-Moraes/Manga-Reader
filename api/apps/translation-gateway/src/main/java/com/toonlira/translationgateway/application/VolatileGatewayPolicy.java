package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.net.URI;
import java.time.Duration;

public final class VolatileGatewayPolicy {
    private VolatileGatewayPolicy() { }
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
            && (!testBudget.isUnmetered() || (testBudget.isEnabled() && testBudget.getDeadline() != null));
        if (!valid) throw new GatewayException(GatewayErrorCode.CAPABILITIES_UNAVAILABLE, 503, false);
    }
    private static boolean https(String value) {
        try {
            var uri = URI.create(value);
            return "https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null && uri.getFragment() == null;
        } catch (IllegalArgumentException error) { return false; }
    }
}
