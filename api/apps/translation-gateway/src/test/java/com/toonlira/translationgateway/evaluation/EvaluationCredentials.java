package com.toonlira.translationgateway.evaluation;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.google.auth.oauth2.ImpersonatedCredentials;
import com.google.auth.oauth2.UserCredentials;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.List;
import java.util.regex.Pattern;

/** Test-only, explicit credentials. No ADC discovery, refresh or network during loading. */
final class EvaluationCredentials {
    private static final int MAX_CREDENTIAL_BYTES = 65_536;
    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

    private EvaluationCredentials() { }

    static ImpersonatedCredentials load(Path file, Path repository, String project, String account) {
        try {
            var root = Files.exists(repository) ? repository.toRealPath() : repository.toAbsolutePath().normalize();
            if (!project.matches("[a-z][a-z0-9-]{4,28}[a-z0-9]")
                || !account.matches("[a-z][a-z0-9-]{4,28}[a-z0-9]@" + Pattern.quote(project) + "\\.iam\\.gserviceaccount\\.com")
                || !file.isAbsolute() || Files.isSymbolicLink(file) || Files.isSymbolicLink(file.getParent())
                || !Files.isRegularFile(file) || file.toRealPath().startsWith(root)
                || !Files.getPosixFilePermissions(file).equals(PosixFilePermissions.fromString("rw-------"))
                || !Files.getPosixFilePermissions(file.getParent()).equals(PosixFilePermissions.fromString("rwx------"))) {
                throw new IllegalArgumentException();
            }
            byte[] bytes;
            try (var input = Files.newInputStream(file)) { bytes = input.readNBytes(MAX_CREDENTIAL_BYTES + 1); }
            if (bytes.length > MAX_CREDENTIAL_BYTES) throw new IllegalArgumentException();
            var info = GatewayJsonMapper.create().readTree(bytes);
            var expected = "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" + account + ":generateAccessToken";
            var source = info.path("source_credentials");
            if (!info.path("type").asText().equals("impersonated_service_account")
                || !info.path("service_account_impersonation_url").asText().equals(expected)
                || (info.has("delegates") && (!info.path("delegates").isArray() || !info.path("delegates").isEmpty()))
                || !info.path("universe_domain").asText("googleapis.com").equals("googleapis.com")
                || !source.path("type").asText().equals("authorized_user")
                || info.has("private_key") || source.has("private_key")) throw new IllegalArgumentException();
            for (var key : List.of("client_id", "client_secret", "refresh_token")) {
                if (!source.path(key).isTextual() || source.path(key).asText().isBlank()) throw new IllegalArgumentException();
            }
            // Construct the supported type directly: never honor endpoints or external-account instructions from JSON.
            var user = UserCredentials.newBuilder().setClientId(source.path("client_id").asText())
                .setClientSecret(source.path("client_secret").asText()).setRefreshToken(source.path("refresh_token").asText()).build();
            return ImpersonatedCredentials.create(user, account, List.of(), List.of(CLOUD_SCOPE), 300)
                .toBuilder().setQuotaProjectId(project).build();
        } catch (Exception ignored) {
            throw new IllegalArgumentException("evaluation-credentials-invalid");
        }
    }
}
