package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RenderingSessionDirectoryTest {
    @TempDir Path temporary;
    @Test void restartRecoversAbandonedFilesBeforeAnotherAdmission() throws Exception {
        var neighbor = Files.writeString(temporary.resolve("neighbor"), "preserved");
        Files.writeString(temporary.resolve("phase"), "abandon");
        runProbe();
        var abandoned = Path.of(Files.readString(temporary.resolve("abandoned")));
        assertThat(Files.exists(abandoned.resolve("original.bin"))).isTrue();
        Files.writeString(temporary.resolve("phase"), "recover");
        runProbe();
        assertThat(Files.exists(abandoned)).isFalse();
        assertThat(Files.readString(neighbor)).isEqualTo("preserved");
    }
    @Test void activeOwnerPreventsRecovery() throws Exception {
        var active = RenderingSessionDirectory.create(temporary);
        try (var channel = FileChannel.open(active.resolve(".owner.lock"), StandardOpenOption.WRITE);
             var lock = channel.lock()) {
            assertThatThrownBy(() -> RenderingSessionDirectory.create(temporary)).isInstanceOf(Exception.class);
            assertThat(Files.exists(active)).isTrue();
        }
        var next = RenderingSessionDirectory.create(temporary);
        assertThat(Files.exists(active)).isFalse();
        IsolatedRenderAdapter.deleteDirectory(next);
    }
    @Test void symlinkAndUnknownEntryRemainUntouchedAndCloseAdmission() throws Exception {
        var directory = RenderingSessionDirectory.create(temporary);
        var neighbor = Files.writeString(temporary.resolve("neighbor"), "preserved");
        Files.createSymbolicLink(directory.resolve("unexpected"), neighbor);
        assertThatThrownBy(() -> RenderingSessionDirectory.create(temporary)).isInstanceOf(java.io.IOException.class);
        assertThat(Files.readString(neighbor)).isEqualTo("preserved");
        assertThat(Files.isSymbolicLink(directory.resolve("unexpected"))).isTrue();
    }
    private void runProbe() throws Exception {
        var child = RenderJvmLauncher.builder(temporary, 64, RenderingSessionDirectoryProbe.class.getName()).start();
        try {
            assertThat(child.waitFor(10, TimeUnit.SECONDS)).isTrue();
            assertThat(child.exitValue()).isZero();
        } finally { child.destroyForcibly(); assertThat(child.waitFor(5, TimeUnit.SECONDS)).isTrue(); }
    }
}
