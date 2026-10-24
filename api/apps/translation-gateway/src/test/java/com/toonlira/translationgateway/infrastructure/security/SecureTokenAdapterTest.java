package com.toonlira.translationgateway.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SecureTokenAdapterTest {
    private final SecureTokenAdapter adapter = new SecureTokenAdapter();

    @Test
    void shouldVerifySyntheticHashesCreatedBeforeTheSecurityStackMigration() {
        // Captured locally with Security 6.5.11 / Bouncy Castle 1.80, never a real credential.
        String legacyHash = "$argon2id$v=19$m=16384,t=2,p=1$0le4AvWbZCCU8LF9lwPMWQ"
            + "$MjIITkh8FqiIjS5IyOFLCnip/UEaOCq1cdSZGrMS9I0";
        assertThat(adapter.matchesCredential("synthetic-legacy-migration-fixture", legacyHash)).isTrue();
        assertThat(adapter.matchesCredential("synthetic-other-fixture", legacyHash)).isFalse();
    }

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
