package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class NativeRuntimeElfTest {
    @TempDir Path temporary;

    @Test void readsOnlyBoundedInterpreterMetadataOfBothMachineTypes() throws Exception {
        for (var interpreter : new String[]{"/lib/ld-musl-aarch64.so.1", "/lib/ld-linux-aarch64.so.1"})
            assertThat(inspect(fixture(183, interpreter), 183)).isEqualTo(interpreter);
        for (var interpreter : new String[]{"/lib/ld-musl-x86_64.so.1", "/lib64/ld-linux-x86-64.so.2"})
            assertThat(inspect(fixture(62, interpreter), 62)).isEqualTo(interpreter);
        var nonPie = fixture(62, "/lib64/ld-linux-x86-64.so.2");
        ByteBuffer.wrap(nonPie).order(ByteOrder.LITTLE_ENDIAN).putShort(16, (short) 2);
        assertThat(inspect(nonPie, 62)).isEqualTo("/lib64/ld-linux-x86-64.so.2");
    }

    @Test void rejectsCrossArchitectureMalformedHeadersAndOffsetsWithoutCauses() throws Exception {
        rejected(fixture(183, "/lib/ld-linux-aarch64.so.1"), 62);
        for (int offset : new int[]{0, 4, 5, 6, 16, 18, 20, 52, 54, 56}) {
            var bytes = fixture(62, "/lib64/ld-linux-x86-64.so.2"); bytes[offset] = 0; rejected(bytes, 62);
        }
        var bytes = fixture(62, "/lib64/ld-linux-x86-64.so.2");
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putLong(32, Long.MAX_VALUE); rejected(bytes, 62);
        bytes = fixture(62, "/lib64/ld-linux-x86-64.so.2");
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putLong(64 + 32, 257); rejected(bytes, 62);
        bytes = fixture(62, "/lib64/ld-linux-x86-64.so.2");
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putLong(64 + 8, Long.MAX_VALUE); rejected(bytes, 62);
        rejected(new byte[63], 62);
        assertThatThrownBy(() -> NativeRuntimeElf.interpreter(temporary.resolve("missing-private"), 62))
            .hasMessage("render-configuration").hasNoCause();
    }

    @Test void rejectsMissingDuplicateUnterminatedOrNonAsciiInterpreter() throws Exception {
        var bytes = fixture(62, "/lib64/ld-linux-x86-64.so.2");
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putInt(64, 1); rejected(bytes, 62);
        bytes = fixture(62, "/lib64/ld-linux-x86-64.so.2");
        var buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        buffer.putShort(56, (short) 2).putInt(120, 3).putLong(128, 256).putLong(152, 26); rejected(bytes, 62);
        bytes = fixture(62, "/lib64/ld-linux-x86-64.so.2");
        int terminator = 256 + Math.toIntExact(ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).getLong(96)) - 1;
        bytes[terminator] = 32; rejected(bytes, 62);
        bytes = fixture(62, "/lib64/ld-linux-x86-64.so.2"); bytes[260] = 0; rejected(bytes, 62);
        bytes = fixture(62, "/lib64/ld-linux-x86-64.so.2"); bytes[260] = (byte) 255; rejected(bytes, 62);
    }

    private String inspect(byte[] bytes, int machine) throws Exception {
        var file = temporary.resolve("runtime"); Files.write(file, bytes);
        return NativeRuntimeElf.interpreter(file, machine);
    }

    private void rejected(byte[] bytes, int machine) {
        assertThatThrownBy(() -> inspect(bytes, machine)).hasMessage("render-configuration").hasNoCause();
    }

    private static byte[] fixture(int machine, String interpreter) {
        var bytes = new byte[512]; var buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        buffer.putInt(0, 0x464c457f); bytes[4] = 2; bytes[5] = 1; bytes[6] = 1;
        buffer.putShort(16, (short) 3).putShort(18, (short) machine).putInt(20, 1);
        buffer.putLong(32, 64).putShort(52, (short) 64).putShort(54, (short) 56).putShort(56, (short) 1);
        byte[] name = (interpreter + "\0").getBytes(StandardCharsets.US_ASCII);
        buffer.putInt(64, 3).putLong(72, 256).putLong(96, name.length);
        System.arraycopy(name, 0, bytes, 256, name.length); return bytes;
    }
}
