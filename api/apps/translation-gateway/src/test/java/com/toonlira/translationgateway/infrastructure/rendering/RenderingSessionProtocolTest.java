package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import org.junit.jupiter.api.Test;

class RenderingSessionProtocolTest {
    @Test void roundTripsOnlyBoundedVersionedMessages() throws Exception {
        var bytes = new ByteArrayOutputStream();
        RenderingSessionProtocol.write(bytes, new RenderingSessionProtocol.Request("FIND", null, null));
        var request = RenderingSessionProtocol.read(new ByteArrayInputStream(bytes.toByteArray()), RenderingSessionProtocol.Request.class);
        assertThat(request.operation()).isEqualTo("FIND");
        assertThat(request.artifacts()).isNull();
    }
    @Test void rejectsOversizeBeforeReadingPayload() throws Exception {
        var bytes = new ByteArrayOutputStream();
        var out = new DataOutputStream(bytes);
        out.writeInt(RenderingSessionProtocol.MAGIC);
        out.writeInt(RenderingSessionProtocol.MAX_BYTES + 1);
        assertThatThrownBy(() -> RenderingSessionProtocol.read(new ByteArrayInputStream(bytes.toByteArray()), RenderingSessionProtocol.Request.class))
            .isInstanceOf(java.io.IOException.class);
    }
    @Test void rejectsUnknownVersionAndTruncation() throws Exception {
        assertThatThrownBy(() -> RenderingSessionProtocol.read(new ByteArrayInputStream(new byte[8]), RenderingSessionProtocol.Request.class))
            .isInstanceOf(java.io.IOException.class);
        var bytes = new ByteArrayOutputStream();
        RenderingSessionProtocol.write(bytes, new RenderingSessionProtocol.Request("FIND", null, null));
        assertThatThrownBy(() -> RenderingSessionProtocol.read(new ByteArrayInputStream(java.util.Arrays.copyOf(bytes.toByteArray(), 10)), RenderingSessionProtocol.Request.class))
            .isInstanceOf(java.io.IOException.class);
    }
}
