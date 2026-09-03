package com.mangareader.translationgateway.application.port;

public interface CredentialHasher {
    String hashCredential(String credential);

    boolean matchesCredential(String credential, String hash);

    String hashToken(String token);
}
