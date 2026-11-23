package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeFalse;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.io.ByteArrayInputStream;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class MediaInspectionServiceTest {
    private final MediaInspectionService.CleanupState state = new MediaInspectionService.CleanupState();
    private final MediaInspectionService inspector = new MediaInspectionService(state);
    @TempDir Path directory;

    @Test
    void failedCleanupRejectsFurtherInspectionsWithoutExposingPath() throws Exception {
        assumeTrue(Files.getFileStore(directory).supportsFileAttributeView("posix"));
        var owned = Files.createDirectory(directory.resolve("owned"));
        var snapshot = Files.writeString(owned.resolve("private-snapshot"), "synthetic");
        try {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("r-x------"));
            assumeFalse(Files.isWritable(owned), "fixture requires enforced directory permissions");
            inspector.deleteQuietly(snapshot);
            assertThat(Files.exists(snapshot)).isTrue();
            assertThatThrownBy(inspector::requireCleanupHealthy).isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getMessage()).isEqualTo("storage-unavailable");
                assertThat(error.getCause()).isNull();
            });
            assertThatThrownBy(() -> inspector.inspect(new ByteArrayInputStream(new byte[32]), 1024))
                .isInstanceOfSatisfying(GatewayException.class,
                    error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE));
        } finally {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("rwx------"));
        }
        inspector.requireCleanupHealthy();
        assertThat(Files.exists(snapshot)).isFalse();
        var png = new byte[32];
        byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        System.arraycopy(signature, 0, png, 0, signature.length);
        png[12] = 'I'; png[13] = 'H'; png[14] = 'D'; png[15] = 'R';
        ByteBuffer.wrap(png, 16, 8).putInt(1).putInt(1);
        var recovered = inspector.inspect(new ByteArrayInputStream(png), 1024);
        inspector.deleteQuietly(recovered.path());
        inspector.requireCleanupHealthy();
    }

    @Test
    void cleanupRetryNeverDeletesAReplacementAtTheSamePath() throws Exception {
        assumeTrue(Files.getFileStore(directory).supportsFileAttributeView("posix"));
        var owned = Files.createDirectory(directory.resolve("replacement-test"));
        var snapshot = Files.writeString(owned.resolve("private-snapshot"), "original");
        var moved = owned.resolve("original-moved");
        try {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("r-x------"));
            assumeFalse(Files.isWritable(owned), "fixture requires enforced directory permissions");
            inspector.deleteQuietly(snapshot);
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("rwx------"));
            Files.move(snapshot, moved);
            Files.writeString(snapshot, "replacement");
            assertThatThrownBy(inspector::requireCleanupHealthy).isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE));
            assertThat(Files.readString(snapshot)).isEqualTo("replacement");
            assertThat(Files.readString(moved)).isEqualTo("original");
        } finally {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("rwx------"));
            Files.deleteIfExists(snapshot);
            Files.deleteIfExists(moved);
        }
    }

    @Test
    void cleanupBacklogIsBoundedAndOverflowRemainsFailClosed() throws Exception {
        assumeTrue(Files.getFileStore(directory).supportsFileAttributeView("posix"));
        var owned = Files.createDirectory(directory.resolve("bounded-cleanup"));
        var files = new java.util.ArrayList<Path>();
        for (int index = 0; index <= MediaInspectionService.MAX_PENDING_CLEANUPS; index++) {
            files.add(Files.writeString(owned.resolve("snapshot-" + index), "synthetic"));
        }
        try {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("r-x------"));
            assumeFalse(Files.isWritable(owned), "fixture requires enforced directory permissions");
            files.forEach(inspector::deleteQuietly);
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("rwx------"));
            assertThatThrownBy(inspector::requireCleanupHealthy).isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE));
            try (var remaining = Files.list(owned)) { assertThat(remaining.count()).isEqualTo(1); }
            for (var path : files) Files.deleteIfExists(path);
            assertThatThrownBy(inspector::requireCleanupHealthy).isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE));
            new MediaInspectionService(new MediaInspectionService.CleanupState()).requireCleanupHealthy();
        } finally {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("rwx------"));
            for (var path : files) Files.deleteIfExists(path);
        }
    }

    @Test
    void cleanupFailureIsSharedBetweenInspectorsInTheSameProcess() throws Exception {
        assumeTrue(Files.getFileStore(directory).supportsFileAttributeView("posix"));
        var other = new MediaInspectionService(state);
        var owned = Files.createDirectory(directory.resolve("shared-cleanup"));
        var snapshot = Files.writeString(owned.resolve("private-snapshot"), "synthetic");
        try {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("r-x------"));
            assumeFalse(Files.isWritable(owned), "fixture requires enforced directory permissions");
            inspector.deleteQuietly(snapshot);
            assertThatThrownBy(other::requireCleanupHealthy).isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE));
        } finally {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("rwx------"));
        }
        other.requireCleanupHealthy();
        assertThat(Files.exists(snapshot)).isFalse();
        inspector.requireCleanupHealthy();
    }

    @Test
    void defaultInspectorsShareCleanupState() throws Exception {
        assumeTrue(Files.getFileStore(directory).supportsFileAttributeView("posix"));
        var first = new MediaInspectionService();
        var second = new MediaInspectionService();
        var owned = Files.createDirectory(directory.resolve("process-cleanup"));
        var snapshot = Files.writeString(owned.resolve("private-snapshot"), "synthetic");
        try {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("r-x------"));
            assumeFalse(Files.isWritable(owned), "fixture requires enforced directory permissions");
            first.deleteQuietly(snapshot);
            assertThatThrownBy(second::requireCleanupHealthy).isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE));
        } finally {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("rwx------"));
            second.requireCleanupHealthy();
            Files.deleteIfExists(snapshot);
        }
        assertThat(Files.exists(snapshot)).isFalse();
    }

    @Test
    void retriesFailedCleanupWhileIdle() throws Exception {
        assumeTrue(Files.getFileStore(directory).supportsFileAttributeView("posix"));
        var service = new MediaInspectionService(new MediaInspectionService.CleanupState(Duration.ofMillis(20)));
        var owned = Files.createDirectory(directory.resolve("idle-cleanup"));
        var snapshot = Files.writeString(owned.resolve("private-snapshot"), "synthetic");
        try {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("r-x------"));
            assumeFalse(Files.isWritable(owned), "fixture requires enforced directory permissions");
            service.deleteQuietly(snapshot);
            assertThat(Files.exists(snapshot)).isTrue();
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("rwx------"));
            long end = System.nanoTime() + Duration.ofSeconds(3).toNanos();
            while (Files.exists(snapshot) && System.nanoTime() < end) Thread.sleep(20);
            assertThat(Files.exists(snapshot)).isFalse();
            service.requireCleanupHealthy();
        } finally {
            Files.setPosixFilePermissions(owned, PosixFilePermissions.fromString("rwx------"));
            Files.deleteIfExists(snapshot);
        }
    }

    @Test
    void shouldInspectPngFromItsSignatureAndIhdr() {
        var bytes = new byte[32];
        byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        System.arraycopy(signature, 0, bytes, 0, signature.length);
        bytes[12] = 'I'; bytes[13] = 'H'; bytes[14] = 'D'; bytes[15] = 'R';
        ByteBuffer.wrap(bytes, 16, 8).putInt(320).putInt(640);

        var result = inspector.inspect(new ByteArrayInputStream(bytes), 1024);
        try {
            assertThat(result.mimeType()).isEqualTo("image/png");
            assertThat(result.widthPx()).isEqualTo(320);
            assertThat(result.heightPx()).isEqualTo(640);
            assertThat(result.sha256()).hasSize(64);
        } finally {
            inspector.deleteQuietly(result.path());
        }
    }

    @Test
    void shouldRejectUnknownOrOversizedContent() {
        assertThatThrownBy(() -> inspector.inspect(new ByteArrayInputStream(new byte[40]), 1024))
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.UNSUPPORTED_MEDIA_TYPE));
        assertThatThrownBy(() -> inspector.inspect(new ByteArrayInputStream(new byte[20]), 10))
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.PAYLOAD_TOO_LARGE));
    }

    @Test
    void shouldRejectARecognizedHeaderWithInvalidDimensions() {
        var bytes = new byte[32];
        byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        System.arraycopy(signature, 0, bytes, 0, signature.length);
        bytes[12] = 'I'; bytes[13] = 'H'; bytes[14] = 'D'; bytes[15] = 'R';
        ByteBuffer.wrap(bytes, 16, 8).putInt(0).putInt(640);

        assertThatThrownBy(() -> inspector.inspect(new ByteArrayInputStream(bytes), 1024))
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.INVALID_REQUEST));
    }
}
