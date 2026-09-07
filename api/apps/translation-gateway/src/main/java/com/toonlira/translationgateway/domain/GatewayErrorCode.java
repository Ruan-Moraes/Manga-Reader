package com.toonlira.translationgateway.domain;

public enum GatewayErrorCode {
    INVALID_REQUEST("invalid-request"),
    INVALID_CONTRACT_VERSION("invalid-contract-version"),
    CONSENT_REQUIRED("consent-required"),
    UNSUPPORTED_PAIR("unsupported-pair"),
    UNSUPPORTED_MEDIA_TYPE("unsupported-media-type"),
    PAYLOAD_TOO_LARGE("payload-too-large"),
    CAPABILITIES_UNAVAILABLE("capabilities-unavailable"),
    GATEWAY_DISABLED("gateway-disabled"),
    UNAUTHORIZED("unauthorized"),
    INSTALLATION_REVOKED("installation-revoked"),
    QUOTA_EXCEEDED("quota-exceeded"),
    JOB_NOT_FOUND("job-not-found"),
    JOB_STATE_CONFLICT("job-state-conflict"),
    CANCELLATION_UNAVAILABLE("cancellation-unavailable"),
    STORAGE_UNAVAILABLE("storage-unavailable"),
    DISPATCH_UNAVAILABLE("dispatch-unavailable"),
    INTERNAL_ERROR("internal-error");

    private final String value;

    GatewayErrorCode(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}
