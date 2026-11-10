package com.toonlira.translationgateway.infrastructure.rendering;

import com.google.cloud.storage.StorageOptions;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.util.Map;

/** A separate JVM verifies persisted cleanup after the failing worker has exited. */
public final class CloudCleanupRecoveryVerifier {
    private CloudCleanupRecoveryVerifier() { }

    public static void main(String[] arguments) throws Exception {
        var configuration = CloudPrivateDeliveryProbe.configuration(System.getenv());
        CloudPrivateDeliveryProbe.verifyMetadataCredentials();
        int completed;
        int references = 0;
        int neighbors = 0;
        var storage = StorageOptions.getDefaultInstance().getService();
        try (var connection = DriverManager.getConnection("jdbc:postgresql://postgres:5432/renderer_probe", "test", "test");
             var statement = connection.createStatement()) {
            try (var result = statement.executeQuery("SELECT count(*) FILTER (WHERE completed_at IS NULL), count(*) FILTER (WHERE completed_at IS NOT NULL) FROM processing_job_result_acknowledgements")) {
                if (!result.next() || result.getInt(1) != 0 || result.getInt(2) != 2)
                    throw new IllegalStateException("cleanup-recovery-not-completed");
                completed = result.getInt(2);
            }
            try (var result = statement.executeQuery("""
                SELECT s.output_object_key, s.rendered_image_object_key FROM processing_job_stages s
                JOIN processing_job_result_acknowledgements a ON a.job_id = s.job_id
                WHERE a.completed_at IS NOT NULL
                """)) {
                while (result.next()) for (int column = 1; column <= 2; column++) {
                    var key = result.getString(column);
                    if (key == null) continue;
                    CloudPrivateDeliveryProbe.requireAbsent(configuration, key);
                    references++;
                    if (column == 2) {
                        var neighbor = storage.get(configuration.bucket(), CloudPrivateDeliveryProbe.neighborKey(key));
                        if (neighbor != null) {
                            neighbors++;
                            if (!storage.delete(neighbor.getBlobId())) throw new IllegalStateException("neighbor-cleanup-incomplete");
                        }
                    }
                }
            }
        }
        if (references < 8 || neighbors != 1) throw new IllegalStateException("cleanup-recovery-evidence-incomplete");
        Files.write(Path.of("/export/cleanup-recovery-result.json"), GatewayJsonMapper.create().writeValueAsBytes(
            Map.of("completedAcknowledgements", completed, "pendingAcknowledgements", 0, "absentReferences", references,
                "neighborPreservedThroughRestart", true, "separateVerifierJvm", true)));
    }
}
