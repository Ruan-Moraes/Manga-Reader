package com.toonlira.translationgateway.infrastructure.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.LinkOption;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class LocalObjectStorageAdapterTest {
    private static final Instant NOW = Instant.parse("2026-10-04T12:00:00Z");
    @TempDir Path directory;

    @Test
    void deletionIsIdempotentButRealFailureIsSanitized() throws Exception {
        var adapter = adapter();
        adapter.delete("private/absent");
        var nonempty = directory.resolve("private/nonempty");
        Files.createDirectories(nonempty);
        Files.writeString(nonempty.resolve("retained"), "synthetic");
        assertThatThrownBy(() -> adapter.delete("private/nonempty"))
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getCause()).isNull();
                assertThat(error.getMessage()).doesNotContain(directory.toString(), "private/nonempty");
            });
        assertThat(Files.readString(nonempty.resolve("retained"))).isEqualTo("synthetic");
    }

    @Test
    void ttlOnlyDeletesPrivateObjectsIncludingExactBoundaryWithoutDeletingReusableSource() throws Exception {
        var source = directory.resolve("source.png");
        Files.writeString(source, "synthetic source");
        var adapter = adapter();
        adapter.store("private/expired", source, "image/png", "a".repeat(64), NOW.minusSeconds(1));
        adapter.store("private/boundary", source, "image/png", "a".repeat(64), NOW);
        adapter.store("private/new", source, "image/png", "a".repeat(64), NOW.plusSeconds(1));
        Files.setLastModifiedTime(source, FileTime.from(NOW.minusSeconds(100)));
        assertThat(adapter.deleteOlderThan(NOW)).isEqualTo(2);
        assertThat(Files.exists(directory.resolve("private/expired"))).isFalse();
        assertThat(Files.exists(directory.resolve("private/boundary"))).isFalse();
        assertThat(Files.readString(directory.resolve("private/new"))).isEqualTo("synthetic source");
        assertThat(Files.readString(source)).isEqualTo("synthetic source");
        assertThat(adapter.deleteOlderThan(NOW)).isZero();
    }

    @Test
    void ttlDoesNotFollowSymlinksOutsidePrivateObjects() throws Exception {
        var target = directory.resolve("reusable.png");
        Files.writeString(target, "synthetic source");
        Files.setLastModifiedTime(target, FileTime.from(NOW.minusSeconds(1)));
        Files.createDirectories(directory.resolve("private"));
        Files.createSymbolicLink(directory.resolve("private/link"), target);
        assertThat(adapter().deleteOlderThan(NOW)).isZero();
        assertThat(Files.readString(target)).isEqualTo("synthetic source");
    }

    @Test
    void rejectsSymlinkedPrivateRootInsteadOfDeletingOutsideObjects() throws Exception {
        var other = directory.resolve("reusable");
        Files.createDirectories(other);
        Files.writeString(other.resolve("source.png"), "synthetic source");
        Files.createSymbolicLink(directory.resolve("private"), other);
        assertThatThrownBy(() -> adapter().deleteOlderThan(NOW.plusSeconds(3600))).isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> adapter().delete("private/source.png")).isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> adapter().open("private/source.png")).isInstanceOf(GatewayException.class);
        assertThat(Files.readString(other.resolve("source.png"))).isEqualTo("synthetic source");
    }

    private LocalObjectStorageAdapter adapter() {
        var properties = new GatewayProperties();
        properties.getStorage().setLocalDirectory(directory);
        return new LocalObjectStorageAdapter(properties);
    }

    @Test
    void originalSnapshotPurgesOnDeadlineWithoutSqlAndNeverDeletesResultOrReusableSource() throws Exception {
        var source = directory.resolve("reusable.png");
        Files.writeString(source, "synthetic source");
        var adapter = adapter();
        var due = OriginalObjectKey.create(NOW, 900);
        var later = OriginalObjectKey.create(NOW, 3600);
        adapter.store(due, source, "image/png", "a".repeat(64), NOW);
        adapter.store(later, source, "image/png", "a".repeat(64), NOW);
        adapter.store("private/rendering/result", source, "image/webp", "a".repeat(64), NOW);
        assertThat(adapter.deleteExpiredOriginals(NOW.plusSeconds(900).minusNanos(1))).isZero();
        assertThat(adapter.deleteExpiredOriginals(NOW.plusSeconds(900))).isEqualTo(1);
        assertThat(Files.exists(directory.resolve(due))).isFalse();
        assertThat(Files.exists(directory.resolve(later))).isTrue();
        assertThat(Files.exists(directory.resolve("private/rendering/result"))).isTrue();
        assertThat(Files.readString(source)).isEqualTo("synthetic source");
        assertThat(adapter.deleteExpiredOriginals(NOW.plusSeconds(900))).isZero();
    }

    @Test
    void originalDeadlineCannotBeRenewedByFileModificationOrSymlink() throws Exception {
        var source = directory.resolve("reusable.png");
        Files.writeString(source, "synthetic source");
        var key = OriginalObjectKey.create(NOW, 1);
        adapter().store(key, source, "image/png", "a".repeat(64), NOW);
        Files.setLastModifiedTime(directory.resolve(key), FileTime.from(NOW.plusSeconds(100)));
        Files.createSymbolicLink(directory.resolve("private/originals/link"), source);
        assertThat(adapter().deleteExpiredOriginals(NOW.plusSeconds(1))).isOne();
        assertThat(Files.exists(directory.resolve(key))).isFalse();
        assertThat(Files.readString(source)).isEqualTo("synthetic source");
        assertThat(Files.isSymbolicLink(directory.resolve("private/originals/link"))).isTrue();
    }

    @Test
    void originalPublishedAfterEarlierSweepIsPurgedWithoutDatabaseOrFreshTtl() throws Exception {
        var source = directory.resolve("reusable.png");
        Files.writeString(source, "synthetic source");
        var key = OriginalObjectKey.create(NOW, 1);
        var adapter = adapter();
        var afterDeadline = NOW.plusSeconds(2);
        assertThat(adapter.deleteExpiredOriginals(afterDeadline)).isZero();
        adapter.store(key, source, "image/png", "a".repeat(64), NOW);
        assertThat(adapter.deleteExpiredOriginals(afterDeadline)).isOne();
        assertThat(Files.exists(directory.resolve(key))).isFalse();
        assertThat(Files.readString(source)).isEqualTo("synthetic source");
        assertThat(adapter.deleteExpiredOriginals(afterDeadline)).isZero();
    }

    @Test void resultPairExpiresInclusivelyWithoutTouchingOriginalOrReusableSource() throws Exception {
        var source = directory.resolve("reusable.png");
        Files.writeString(source, "synthetic source");
        var adapter = adapter();
        var deadline = NOW.plusSeconds(60);
        var image = ResultObjectKey.create(deadline, "webp");
        var manifest = ResultObjectKey.create(deadline, "json");
        var original = OriginalObjectKey.create(NOW, 3600);
        adapter.store(image, source, "image/webp", "a".repeat(64), NOW);
        adapter.store(manifest, source, "application/json", "a".repeat(64), NOW.plusSeconds(1));
        adapter.store(original, source, "image/png", "a".repeat(64), NOW);
        Files.setLastModifiedTime(directory.resolve(image), FileTime.from(NOW.plusSeconds(300)));
        assertThat(adapter.deleteExpiredResults(deadline.minusNanos(1))).isZero();
        assertThat(adapter.deleteExpiredResults(deadline)).isEqualTo(2);
        assertThat(Files.exists(directory.resolve(image))).isFalse();
        assertThat(Files.exists(directory.resolve(manifest))).isFalse();
        assertThat(Files.exists(directory.resolve(original))).isTrue();
        assertThat(Files.readString(source)).isEqualTo("synthetic source");
        assertThat(adapter.deleteExpiredResults(deadline)).isZero();
    }

    @ParameterizedTest @ValueSource(strings = {"original", "result", "age"})
    void unreadableMetadataDoesNotBlockOtherObjectsAndNextRoundRecovers(String phase) throws Exception {
        var source = directory.resolve("reusable.png");
        Files.writeString(source, "synthetic source");
        var adapter = adapter();
        var first = phase.equals("original") ? OriginalObjectKey.create(NOW.minusSeconds(1), 1)
            : phase.equals("result") ? ResultObjectKey.create(NOW, "webp") : "private/first";
        var second = phase.equals("original") ? OriginalObjectKey.create(NOW.minusSeconds(1), 1)
            : phase.equals("result") ? ResultObjectKey.create(NOW, "json") : "private/second";
        for (var key : List.of(first, second)) adapter.store(key, source, "application/json", "a".repeat(64), NOW.minusSeconds(1));
        var calls = new AtomicInteger();
        var failed = new AtomicReference<Path>();
        try (var metadata = mockStatic(Files.class, CALLS_REAL_METHODS)) {
            for (var key : List.of(first, second)) {
                var path = directory.resolve(key);
                metadata.when(() -> Files.getLastModifiedTime(path, LinkOption.NOFOLLOW_LINKS)).thenAnswer(call -> {
                    if (calls.getAndIncrement() == 0) { failed.set(path); throw new IOException("private sensitive detail"); }
                    return call.callRealMethod();
                });
            }
            assertThatThrownBy(() -> sweep(adapter, phase))
                .isInstanceOfSatisfying(GatewayException.class, error -> {
                    assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                    assertThat(error.getCause()).isNull();
                    assertThat(error.getMessage()).doesNotContain("sensitive", directory.toString());
                });
        }
        assertThat(failed.get()).isNotNull();
        assertThat(Files.exists(failed.get())).isTrue();
        for (var key : List.of(first, second)) if (!directory.resolve(key).equals(failed.get())) assertThat(Files.exists(directory.resolve(key))).isFalse();
        assertThat(Files.readString(source)).isEqualTo("synthetic source");
        assertThat(sweep(adapter, phase)).isOne();
        assertThat(sweep(adapter, phase)).isZero();
    }

    private int sweep(LocalObjectStorageAdapter adapter, String phase) {
        return switch (phase) {
            case "original" -> adapter.deleteExpiredOriginals(NOW);
            case "result" -> adapter.deleteExpiredResults(NOW);
            default -> adapter.deleteOlderThan(NOW);
        };
    }
}
