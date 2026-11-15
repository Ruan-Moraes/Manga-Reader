package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class MediaInspectionRestartTest {
    @TempDir Path temporary;

    @Test
    void freshJvmDiscardsAbandonedSnapshotBeforeAdmittingAnotherInspection() throws Exception {
        assertThat(probe("abandon")).isEqualTo(7);
        assertThat(snapshotCount(temporary)).isEqualTo(1);
        var neighbor = Files.writeString(temporary.resolve("unrelated-control"), "synthetic-control");
        assertThat(probe("recover")).isZero();
        assertThat(snapshotCount(temporary)).isZero();
        assertThat(Files.readString(neighbor)).isEqualTo("synthetic-control");
    }

    @Test
    void activeJvmOwnsItsSnapshotAndAnotherJvmFailsClosed() throws Exception {
        var owner = start("hold");
        try {
            var ready = temporary.resolve("hold-ready");
            long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
            while (!Files.exists(ready) && owner.isAlive() && System.nanoTime() < deadline) Thread.sleep(20);
            assertThat(Files.exists(ready)).isTrue();
            assertThat(probe("recover")).isNotZero();
            assertThat(snapshotCount(temporary)).isEqualTo(1);
            owner.getOutputStream().write(1);
            owner.getOutputStream().flush();
            assertThat(owner.waitFor(Duration.ofSeconds(5))).isTrue();
            assertThat(owner.exitValue()).isEqualTo(7);
            assertThat(probe("recover")).isZero();
            assertThat(snapshotCount(temporary)).isZero();
        } finally { stop(owner); }
    }

    @Test
    void unexpectedPrivateEntryIsPreservedAndBlocksAdmissionAfterRestart() throws Exception {
        assertThat(probe("abandon")).isEqualTo(7);
        var unknown = Files.writeString(snapshotRoot().resolve("unrecognized-control"), "synthetic-control");
        assertThat(probe("recover")).isNotZero();
        assertThat(Files.readString(unknown)).isEqualTo("synthetic-control");
        Files.delete(unknown);
        assertThat(probe("recover")).isZero();
    }

    @Test
    void refusedRecoveryDoesNotAdmitAndCanRecoverAfterPermissionsAreRestored() throws Exception {
        assertThat(probe("abandon")).isEqualTo(7);
        var root = snapshotRoot();
        try {
            Files.setPosixFilePermissions(root, PosixFilePermissions.fromString("r-x------"));
            assertThat(probe("recover")).isNotZero();
            assertThat(snapshotCount(temporary)).isEqualTo(1);
        } finally {
            Files.setPosixFilePermissions(root, PosixFilePermissions.fromString("rwx------"));
        }
        assertThat(probe("recover")).isZero();
        assertThat(snapshotCount(temporary)).isZero();
    }

    @Test
    void recoveryNeverFollowsSnapshotSymlink() throws Exception {
        assertThat(probe("abandon")).isEqualTo(7);
        var neighbor = Files.writeString(temporary.resolve("outside-control"), "synthetic-control");
        var link = Files.createSymbolicLink(snapshotRoot().resolve("snapshot-123.upload"), neighbor);
        assertThat(probe("recover")).isNotZero();
        assertThat(Files.isSymbolicLink(link)).isTrue();
        assertThat(Files.readString(neighbor)).isEqualTo("synthetic-control");
        Files.delete(link);
        assertThat(probe("recover")).isZero();
    }

    private Path snapshotRoot() { return temporary.resolve("translation-media-snapshots-v1"); }

    @Test
    void legacySnapshotWithoutOwnershipProofBlocksAdmissionAndIsNeverDeleted() throws Exception {
        var legacy = Files.writeString(temporary.resolve("translation-page-123.upload"), "synthetic-control");
        assertThat(probe("recover")).isNotZero();
        assertThat(Files.readString(legacy)).isEqualTo("synthetic-control");
        assertThat(snapshotCount(temporary)).isEqualTo(1);
        Files.delete(legacy);
        assertThat(probe("recover")).isZero();
    }

    private int probe(String mode) throws Exception {
        var process = start(mode);
        try {
            assertThat(process.waitFor(Duration.ofSeconds(15))).isTrue();
            return process.exitValue();
        } finally { stop(process); }
    }

    private Process start(String mode) throws Exception {
        return new ProcessBuilder(Path.of(System.getProperty("java.home"), "bin", "java").toString(),
            "-Djava.io.tmpdir=" + temporary, "-cp", System.getProperty("java.class.path"),
            RestartProbe.class.getName(), mode, temporary.toString()).redirectErrorStream(true)
            .redirectOutput(temporary.resolve(mode + ".log").toFile()).start();
    }

    private void stop(Process process) throws Exception {
        if (process.isAlive()) {
            process.destroyForcibly();
            assertThat(process.waitFor(Duration.ofSeconds(5))).isTrue();
        }
    }

    private static long snapshotCount(Path root) throws Exception {
        try (var paths = Files.walk(root)) {
            return paths.filter(path -> path.getFileName().toString().endsWith(".upload")).count();
        }
    }

    public static final class RestartProbe {
        public static void main(String[] args) throws Exception {
            var inspector = new MediaInspectionService();
            var header = new byte[32];
            byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
            System.arraycopy(signature, 0, header, 0, signature.length);
            header[12] = 'I'; header[13] = 'H'; header[14] = 'D'; header[15] = 'R';
            ByteBuffer.wrap(header, 16, 8).putInt(1).putInt(1);
            var media = inspector.inspect(new ByteArrayInputStream(header), 1024);
            if (args[0].equals("hold")) {
                Files.writeString(Path.of(args[1]).resolve("hold-ready"), "synthetic-control");
                System.in.read();
                System.exit(7);
            }
            if (args[0].equals("abandon")) System.exit(7);
            if (snapshotCount(Path.of(args[1])) != 1) System.exit(17);
            inspector.deleteQuietly(media.path());
            inspector.requireCleanupHealthy();
        }
    }
}
