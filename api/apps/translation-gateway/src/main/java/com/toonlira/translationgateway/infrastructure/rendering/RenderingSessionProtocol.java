package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.Instant;
import tools.jackson.core.StreamReadFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.DeserializationFeature;

/** Bounded private framing; no polymorphic types, object serialization, credentials or raster payloads. */
final class RenderingSessionProtocol {
    static final int MAGIC = 0x54534e31;
    static final int MAX_BYTES = 64 * 1024;
    private static final ObjectMapper MAPPER = GatewayJsonMapper.create().rebuild()
        .enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
        .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS).build();
    private RenderingSessionProtocol() { }

    static <T> T read(InputStream stream, Class<T> type) throws IOException {
        var in = new DataInputStream(stream);
        if (in.readInt() != MAGIC) throw new IOException("session-version");
        int length = in.readInt();
        if (length < 1 || length > MAX_BYTES) throw new IOException("session-size");
        var bytes = in.readNBytes(length);
        if (bytes.length != length) throw new IOException("session-truncated");
        try { return MAPPER.readValue(bytes, type); }
        catch (RuntimeException invalid) { throw new IOException("session-invalid"); }
    }
    static void write(OutputStream stream, Object value) throws IOException {
        byte[] bytes;
        try { bytes = MAPPER.writeValueAsBytes(value); }
        catch (RuntimeException invalid) { throw new IOException("session-invalid"); }
        if (bytes.length < 1 || bytes.length > MAX_BYTES) throw new IOException("session-size");
        var out = new DataOutputStream(stream);
        out.writeInt(MAGIC); out.writeInt(bytes.length); out.write(bytes); out.flush();
    }
    record Request(String operation, RenderingJobRepository.Artifacts artifacts, Instant lease, String key) {
        Request(String operation, RenderingJobRepository.Artifacts artifacts, Instant lease) { this(operation, artifacts, lease, null); }
    }
    record Reply(RenderingJobRepository.WorkItem job, RenderingJobRepository.Claim claim,
                 boolean accepted, LifecycleCleanupRepository.CleanupClaim cleanup) { }
    record Start(RenderingJobRepository.WorkItem job, String storageMode, String storageDirectory, String bucket,
                 NativeRenderChildSettings codec, long maxBytes, int maxWidth, int maxHeight, long maxPixels,
                 Instant deadline) { }
}
