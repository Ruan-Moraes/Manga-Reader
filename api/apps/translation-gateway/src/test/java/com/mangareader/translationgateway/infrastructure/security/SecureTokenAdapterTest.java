package com.mangareader.translationgateway.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SecureTokenAdapterTest {
    private final SecureTokenAdapter adapter = new SecureTokenAdapter();

    @Test
    void shouldGenerateOpaqueTokensAndStoreOnlyOneWayHashes() {
        var credential = adapter.generate();
        var other = adapter.generate();
        var credentialHash = adapter.hashCredential(credential);

        assertThat(credential).hasSizeGreaterThanOrEqualTo(32).isNotEqualTo(other);
        assertThat(credentialHash).doesNotContain(credential).startsWith("$argon2");
        assertThat(adapter.matchesCredential(credential, credentialHash)).isTrue();
        assertThat(adapter.matchesCredential(other, credentialHash)).isFalse();
        assertThat(adapter.hashToken(credential)).hasSize(64).doesNotContain(credential);
    }
}
