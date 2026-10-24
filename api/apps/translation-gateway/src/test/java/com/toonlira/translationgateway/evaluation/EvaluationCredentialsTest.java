package com.toonlira.translationgateway.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ImpersonatedCredentials;
import com.toonlira.translationgateway.infrastructure.ocr.EvaluationVisionCapture;
import com.toonlira.translationgateway.infrastructure.ocr.VisionClientFactory;
import com.toonlira.translationgateway.infrastructure.storage.EvaluationStorageFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Map;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;

class EvaluationCredentialsTest {
    @TempDir Path temporary;
    private static final String ACCOUNT = "ocr-eval@test-project.iam.gserviceaccount.com";
    private final ObjectMapper mapper = GatewayJsonMapper.create();

    @Test void loadsOnlyValidatedImpersonationAndSetsExplicitQuotaWithoutAdcOrNetwork() throws Exception {
        var file = credential(ACCOUNT);
        var before = Files.readAllBytes(file);
        try (var defaults = Mockito.mockStatic(GoogleCredentials.class, Mockito.CALLS_REAL_METHODS)) {
            var credentials = EvaluationCredentials.load(file, temporary.resolve("repo"), "test-project", ACCOUNT);
            assertThat(credentials).isInstanceOf(ImpersonatedCredentials.class);
            assertThat(credentials.getAccount()).isEqualTo(ACCOUNT);
            assertThat(credentials.getQuotaProjectId()).isEqualTo("test-project");
            assertThat(credentials.getAccessToken()).isNull();
            var storage = EvaluationStorageFactory.options(credentials, "test-project");
            assertThat(storage.getCredentials()).isSameAs(credentials);
            assertThat(storage.getProjectId()).isEqualTo("test-project");
            assertThat(storage.getQuotaProjectId()).isEqualTo("test-project");
            var vision = EvaluationVisionCapture.settings(credentials, new EvaluationVisionCapture(temporary, false));
            assertThat(vision.getCredentialsProvider().getCredentials()).isSameAs(credentials);
            assertThat(vision.getQuotaProjectId()).isEqualTo("test-project");
            assertThat(vision.getEndpoint()).isEqualTo(VisionClientFactory.ENDPOINT);
            assertThat(vision.batchAnnotateImagesSettings().getRetryableCodes()).isEmpty();
            assertThat(vision.batchAnnotateImagesSettings().getRetrySettings().getMaxAttempts()).isEqualTo(1);
            defaults.verify(GoogleCredentials::getApplicationDefault, Mockito.never());
        }
        assertThat(Files.readAllBytes(file)).isEqualTo(before);
    }

    @Test void rejectsWrongIdentityRepoPathSymlinksAndLoosePermissions() throws Exception {
        var file = credential("other@test-project.iam.gserviceaccount.com");
        assertRejected(file, temporary.resolve("repo"));
        Files.delete(file);
        file = credential(ACCOUNT);
        assertRejected(file, temporary);
        var link = temporary.resolve("link.json");
        Files.createSymbolicLink(link, file);
        assertRejected(link, temporary.resolve("repo"));
        Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("rw-r--r--"));
        assertRejected(file, temporary.resolve("repo"));
    }

    @Test void rejectsNonImpersonatedCredentialWithoutInitializingProviders() throws Exception {
        var file = credential(ACCOUNT);
        Files.writeString(file, "{\"type\":\"service_account\",\"private_key\":\"SYNTHETIC\"}");
        assertRejected(file, temporary.resolve("repo"));
    }

    private void assertRejected(Path file, Path repo) {
        assertThatThrownBy(() -> EvaluationCredentials.load(file, repo, "test-project", ACCOUNT))
            .hasMessage("evaluation-credentials-invalid").hasNoCause();
    }

    private Path credential(String account) throws Exception {
        Files.setPosixFilePermissions(temporary, PosixFilePermissions.fromString("rwx------"));
        var file = temporary.resolve("adc.json");
        Files.createFile(file, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        Files.write(file, mapper.writeValueAsBytes(Map.of(
            "type", "impersonated_service_account", "delegates", List.of(),
            "service_account_impersonation_url", "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" + account + ":generateAccessToken",
            "source_credentials", Map.of("type", "authorized_user", "client_id", "synthetic-client", "client_secret", "synthetic-secret", "refresh_token", "synthetic-refresh"))));
        return file;
    }
}
