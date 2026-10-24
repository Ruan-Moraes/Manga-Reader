package com.toonlira.translationgateway.infrastructure.security;

import com.toonlira.translationgateway.application.port.CredentialHasher;
import com.toonlira.translationgateway.application.port.OpaqueTokenGenerator;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SecureTokenAdapter implements CredentialHasher, OpaqueTokenGenerator {
    private final SecureRandom random = new SecureRandom();
    private final Argon2PasswordEncoder encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

    @Override
    public String generate() {
        var bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Override
    public String hashCredential(String credential) {
        return encoder.encode(credential);
    }

    @Override
    public boolean matchesCredential(String credential, String hash) {
        return encoder.matches(credential, hash);
    }

    @Override
    public String hashToken(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
