package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class NativeCodecImageAdmissionMainTest {
    @TempDir Path temporary;
    @Test void rejectsArchiveSymlinkBadPinAndChangedBytesWithoutPathsOrCauses() throws Exception {
        var file = Files.writeString(temporary.resolve("private-archive.jar"), "synthetic").toRealPath();
        var pin = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(file)));
        NativeCodecImageAdmissionMain.verifyArchiveHash(file, pin);
        for (var invalid : new String[]{"", "0".repeat(64), "private-secret"})
            assertThatThrownBy(() -> NativeCodecImageAdmissionMain.verifyArchiveHash(file, invalid))
                .hasMessage("render-configuration").hasNoCause();
        var link = temporary.resolve("link.jar"); Files.createSymbolicLink(link, file);
        assertThatThrownBy(() -> NativeCodecImageAdmissionMain.verifyArchiveHash(link, pin))
            .hasMessage("render-configuration").hasNoCause();
        Files.writeString(file, "changed");
        assertThatThrownBy(() -> NativeCodecImageAdmissionMain.verifyArchiveHash(file, pin))
            .hasMessage("render-configuration").hasNoCause();
    }
    @Test void missingArchiveAndNullConfigurationAreSanitized() {
        assertThatThrownBy(() -> NativeCodecImageAdmissionMain.verifyArchiveHash(temporary.resolve("missing"), "a".repeat(64)))
            .hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> NativeCodecImageAdmissionMain.verifyArchiveHash(null, null))
            .hasMessage("render-configuration").hasNoCause();
    }
}
