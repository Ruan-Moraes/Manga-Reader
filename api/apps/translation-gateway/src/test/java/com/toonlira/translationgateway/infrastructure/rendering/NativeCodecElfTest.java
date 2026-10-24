package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import org.junit.jupiter.api.Test;

class NativeCodecElfTest {
    static final String WEBP = "libwebp.so.7";
    static final String MUSL = "libc.musl-aarch64.so.1";

    @Test void narrowElfAdmissionChecksActualMetadataWithoutLoadingCode() {
        NativeCodecElf.verify(fixture(WEBP, "$ORIGIN", MUSL), WEBP, Set.of(MUSL));
        for (var field : new int[]{0, 4, 5, 6, 16, 18, 20, 54}) {
            var bytes = fixture(WEBP, "$ORIGIN", MUSL); bytes[field] = 0;
            rejected(bytes);
        }
    }

    @Test void rejectsAbsoluteOrMultipleSearchPathsAndUnexpectedDependencies() {
        for (var path : new String[]{"/build/install/lib", "$ORIGIN:/tmp", "", "${ORIGIN}"})
            rejected(fixture(WEBP, path, MUSL));
        rejected(fixture("another.so", "$ORIGIN", MUSL));
        rejected(fixture(WEBP, "$ORIGIN", "libprivate.so"));
        rejected(fixture(WEBP, "$ORIGIN", "../" + MUSL));
    }

    @Test void malformedBoundsMissingTerminatorAndDuplicateDynamicTagsFailClosed() {
        var bytes = fixture(WEBP, "$ORIGIN", MUSL);
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putLong(32, Long.MAX_VALUE); rejected(bytes);
        bytes = fixture(WEBP, "$ORIGIN", MUSL);
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putLong(256 + 5 * 16, 29); rejected(bytes);
        bytes = fixture(WEBP, "$ORIGIN", MUSL);
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putLong(256 + 4 * 16, 5); rejected(bytes);
        bytes = fixture(WEBP, "$ORIGIN", MUSL);
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putLong(256 + 3 * 16, 15); rejected(bytes);
        bytes = fixture(WEBP, "$ORIGIN", MUSL);
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putLong(256 + 4 * 16 + 8, Long.MAX_VALUE); rejected(bytes);
        rejected(new byte[63]);
    }

    static byte[] fixture(String soname, String runpath, String... dependencies) {
        var bytes = new byte[1024]; var buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        buffer.putInt(0, 0x464c457f); bytes[4] = 2; bytes[5] = 1; bytes[6] = 1;
        buffer.putShort(16, (short) 3).putShort(18, (short) 183).putInt(20, 1);
        buffer.putLong(32, 64).putShort(52, (short) 64).putShort(54, (short) 56).putShort(56, (short) 2);
        buffer.putInt(64, 1).putLong(64 + 8, 0).putLong(64 + 16, 0x1000).putLong(64 + 32, bytes.length);
        buffer.putInt(120, 2).putLong(120 + 8, 256).putLong(120 + 32, (5L + dependencies.length) * 16);
        var stringBuilder = new StringBuilder("\0" + soname + "\0" + runpath + "\0");
        var offsets = new long[dependencies.length];
        for (int i = 0; i < dependencies.length; i++) { offsets[i] = stringBuilder.length(); stringBuilder.append(dependencies[i]).append('\0'); }
        var strings = stringBuilder.toString().getBytes(StandardCharsets.US_ASCII);
        System.arraycopy(strings, 0, bytes, 512, strings.length);
        long[][] tags = new long[5 + dependencies.length][2];
        tags[0] = new long[]{5, 0x1200}; tags[1] = new long[]{10, strings.length};
        tags[2] = new long[]{14, 1}; tags[3] = new long[]{29, 2 + soname.length()};
        for (int i = 0; i < offsets.length; i++) tags[4 + i] = new long[]{1, offsets[i]};
        for (int i = 0; i < tags.length; i++) buffer.putLong(256 + i * 16, tags[i][0]).putLong(264 + i * 16, tags[i][1]);
        return bytes;
    }
    private static void rejected(byte[] bytes) {
        assertThatThrownBy(() -> NativeCodecElf.verify(bytes, WEBP, Set.of(MUSL)))
            .hasMessage("render-configuration").hasNoCause();
    }
}
