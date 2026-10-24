package com.toonlira.translationgateway.infrastructure.persistence;

import com.toonlira.translationgateway.application.port.ResultDownloadRepository;
import com.toonlira.translationgateway.domain.rendering.ReadyResultReference;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcResultDownloadRepository implements ResultDownloadRepository {
    static final String READY_PROJECTION = """
        SELECT j.width_px, j.height_px, s.rendered_image_object_key, s.rendered_image_sha256,
               s.rendered_image_byte_size, s.output_object_key, s.output_sha256, s.completed_at, s.result_expires_at
        FROM processing_jobs j JOIN processing_job_stages s ON s.job_id = j.id AND s.stage = 'RENDERING'
        WHERE j.installation_id = :owner AND j.job_ref = :ref AND j.status = 'READY' AND s.status = 'SUCCEEDED'
        FOR UPDATE OF j
        """;
    private final JdbcClient jdbc;
    public JdbcResultDownloadRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Override public Optional<ReadyResultReference> findReady(UUID installationId, UUID jobRef) {
        return jdbc.sql(READY_PROJECTION).param("owner", installationId).param("ref", jobRef)
            .query((row, ignored) -> new ReadyResultReference(row.getInt("width_px"), row.getInt("height_px"),
                row.getString("rendered_image_object_key"), row.getString("rendered_image_sha256"),
                row.getLong("rendered_image_byte_size"), row.getString("output_object_key"),
                row.getString("output_sha256"), row.getObject("completed_at", OffsetDateTime.class).toInstant(),
                row.getObject("result_expires_at", OffsetDateTime.class).toInstant()))
            .optional();
    }
}
