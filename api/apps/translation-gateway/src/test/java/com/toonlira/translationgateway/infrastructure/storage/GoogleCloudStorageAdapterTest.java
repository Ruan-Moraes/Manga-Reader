package com.toonlira.translationgateway.infrastructure.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.BlobWriteOption;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Storage.BlobListOption;
import com.google.api.gax.paging.Page;
import com.google.cloud.storage.StorageException;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import java.io.InputStream;
import java.nio.file.Files;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Iterator;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class GoogleCloudStorageAdapterTest {
    @TempDir
    java.nio.file.Path temporaryDirectory;

    @Test
    void shouldCreatePrivateObjectsWithAnExistencePrecondition() throws Exception {
        var storage = mock(Storage.class);
        var source = temporaryDirectory.resolve("page.png");
        Files.write(source, new byte[] {1, 2, 3});
        var createdAt = Instant.parse("2026-09-02T12:00:00Z");

        new GoogleCloudStorageAdapter(storage, "private-test-bucket")
            .store("private/originals/object", source, "image/png", "a".repeat(64), createdAt);

        var info = ArgumentCaptor.forClass(BlobInfo.class);
        var options = ArgumentCaptor.forClass(BlobWriteOption[].class);
        verify(storage).createFrom(info.capture(), any(InputStream.class), options.capture());
        assertThat(info.getValue().getBucket()).isEqualTo("private-test-bucket");
        assertThat(info.getValue().getName()).isEqualTo("private/originals/object");
        assertThat(info.getValue().getContentType()).isEqualTo("image/png");
        assertThat(info.getValue().getMetadata()).containsEntry("sha256", "a".repeat(64));
        assertThat(options.getValue()).contains(BlobWriteOption.doesNotExist());
    }

    @Test
    void shouldDeleteTheExactOrphanObject() {
        var storage = mock(Storage.class);

        new GoogleCloudStorageAdapter(storage, "private-test-bucket").delete("private/originals/orphan");

        verify(storage).delete(eq(com.google.cloud.storage.BlobId.of("private-test-bucket", "private/originals/orphan")));
    }

    @Test
    void deletionFailureIsNotAcknowledgedAsSuccessAndDoesNotLeakProviderDetails() {
        var storage = mock(Storage.class);
        var id = BlobId.of("private-test-bucket", "private/originals/retained");
        when(storage.delete(id)).thenThrow(new StorageException(503, "private/originals/retained synthetic provider detail"));
        assertThatThrownBy(() -> new GoogleCloudStorageAdapter(storage, "private-test-bucket").delete(id.getName()))
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getCause()).isNull();
                assertThat(error.getMessage()).doesNotContain(id.getName(), "provider detail", "private-test-bucket");
            });
    }

    @Test
    void missingObjectDeletionIsIdempotent() {
        var storage = mock(Storage.class);
        var id = BlobId.of("private-test-bucket", "private/originals/absent");
        when(storage.delete(id)).thenReturn(false);
        new GoogleCloudStorageAdapter(storage, "private-test-bucket").delete(id.getName());
        verify(storage).delete(id);
    }

    @Test
    @SuppressWarnings("unchecked")
    void ttlIsPrivateInclusiveAndCountsOnlyObjectsActuallyDeleted() {
        var storage = mock(Storage.class);
        var page = (Page<Blob>) mock(Page.class);
        var cutoff = Instant.parse("2026-10-04T12:00:00Z");
        var expired = blob("private/expired", cutoff.minusSeconds(1));
        var boundary = blob("private/boundary", cutoff);
        var current = blob("private/current", cutoff.plusSeconds(1));
        when(storage.list("private-test-bucket", BlobListOption.prefix("private/"))).thenReturn(page);
        when(page.iterateAll()).thenReturn(List.of(expired, boundary, current));
        when(storage.delete(expired.getBlobId())).thenReturn(true);
        when(storage.delete(boundary.getBlobId())).thenReturn(false);
        assertThat(new GoogleCloudStorageAdapter(storage, "private-test-bucket").deleteOlderThan(cutoff)).isOne();
        verify(storage).delete(expired.getBlobId());
        verify(storage).delete(boundary.getBlobId());
        verify(storage, never()).delete(current.getBlobId());
    }

    @Test
    @SuppressWarnings("unchecked")
    void ttlDeleteFailureIsSanitizedAndPropagated() {
        var storage = mock(Storage.class);
        var page = (Page<Blob>) mock(Page.class);
        var cutoff = Instant.parse("2026-10-04T12:00:00Z");
        var expired = blob("private/retained", cutoff.minusSeconds(1));
        when(storage.list("private-test-bucket", BlobListOption.prefix("private/"))).thenReturn(page);
        when(page.iterateAll()).thenReturn(List.of(expired));
        when(storage.delete(expired.getBlobId())).thenThrow(new StorageException(503, "synthetic sensitive detail"));
        assertThatThrownBy(() -> new GoogleCloudStorageAdapter(storage, "private-test-bucket").deleteOlderThan(cutoff))
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getCause()).isNull();
                assertThat(error.getMessage()).doesNotContain("sensitive detail");
            });
    }

    private Blob blob(String key, Instant createdAt) {
        var blob = mock(Blob.class);
        when(blob.getBlobId()).thenReturn(BlobId.of("private-test-bucket", key));
        when(blob.getCreateTimeOffsetDateTime()).thenReturn(OffsetDateTime.ofInstant(createdAt, ZoneOffset.UTC));
        return blob;
    }

    @Test
    @SuppressWarnings("unchecked")
    void originalDeadlineSurvivesLateUploadAndNeverSweepsResults() {
        var storage = mock(Storage.class);
        var page = (Page<Blob>) mock(Page.class);
        var start = Instant.parse("2026-10-09T00:00:00Z");
        var deadline = start.plusSeconds(900);
        var late = blob(OriginalObjectKey.create(start, 900), deadline.plusSeconds(1));
        var later = blob(OriginalObjectKey.create(start, 3600), start);
        var result = blob("private/rendering/result", start.minusSeconds(4000));
        var legacy = blob("private/originals/legacy", deadline.minusSeconds(3600));
        when(storage.list("private-test-bucket", BlobListOption.prefix(OriginalObjectKey.PREFIX))).thenReturn(page);
        when(page.iterateAll()).thenReturn(List.of(late, later, result, legacy));
        when(storage.delete(late.getBlobId())).thenReturn(true);
        when(storage.delete(legacy.getBlobId())).thenReturn(false);
        assertThat(new GoogleCloudStorageAdapter(storage, "private-test-bucket").deleteExpiredOriginals(deadline)).isOne();
        verify(storage).delete(late.getBlobId());
        verify(storage).delete(legacy.getBlobId());
        verify(storage, never()).delete(later.getBlobId());
        verify(storage, never()).delete(result.getBlobId());
    }

    @Test
    @SuppressWarnings("unchecked")
    void malformedOriginalExpiryFailsClosedWithoutLeakingKeyOrProviderDetails() {
        var storage = mock(Storage.class);
        var page = (Page<Blob>) mock(Page.class);
        var invalid = blob("private/originals/v1/invalid/private-sensitive-key", Instant.EPOCH);
        when(storage.list("private-test-bucket", BlobListOption.prefix(OriginalObjectKey.PREFIX))).thenReturn(page);
        when(page.iterateAll()).thenReturn(List.of(invalid));
        assertThatThrownBy(() -> new GoogleCloudStorageAdapter(storage, "private-test-bucket").deleteExpiredOriginals(Instant.now()))
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getCause()).isNull();
                assertThat(error.getMessage()).doesNotContain("private-sensitive-key", "private-test-bucket");
            });
        verify(storage, never()).delete(any(BlobId.class));
    }

    @Test @SuppressWarnings("unchecked")
    void finalPairExpirySurvivesLatePublicationWithoutSweepingOtherNamespaces() {
        var storage = mock(Storage.class);
        var page = (Page<Blob>) mock(Page.class);
        var deadline = Instant.parse("2026-10-09T00:00:00Z");
        var image = blob(ResultObjectKey.create(deadline, "webp"), deadline.plusSeconds(1));
        var manifest = blob(ResultObjectKey.create(deadline, "json"), deadline.plusSeconds(2));
        var original = blob("private/originals/retained", deadline.minusSeconds(4000));
        when(storage.list("private-test-bucket", BlobListOption.prefix(ResultObjectKey.PREFIX))).thenReturn(page);
        when(page.iterateAll()).thenReturn(List.of(image, manifest, original));
        when(storage.delete(image.getBlobId())).thenReturn(true);
        when(storage.delete(manifest.getBlobId())).thenReturn(false);
        assertThat(new GoogleCloudStorageAdapter(storage, "private-test-bucket").deleteExpiredResults(deadline)).isOne();
        verify(storage).delete(image.getBlobId());
        verify(storage).delete(manifest.getBlobId());
        verify(storage, never()).delete(original.getBlobId());
    }

    @Test @SuppressWarnings("unchecked")
    void failedFinalDeletionIsSanitizedRatherThanAcknowledgedAsSuccess() {
        var storage = mock(Storage.class);
        var page = (Page<Blob>) mock(Page.class);
        var deadline = Instant.parse("2026-10-09T00:00:00Z");
        var image = blob(ResultObjectKey.create(deadline, "webp"), deadline.minusSeconds(30));
        when(storage.list("private-test-bucket", BlobListOption.prefix(ResultObjectKey.PREFIX))).thenReturn(page);
        when(page.iterateAll()).thenReturn(List.of(image));
        when(storage.delete(image.getBlobId())).thenThrow(new StorageException(503, "sensitive provider detail"));
        assertThatThrownBy(() -> new GoogleCloudStorageAdapter(storage, "private-test-bucket").deleteExpiredResults(deadline))
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getCause()).isNull();
                assertThat(error.getMessage()).doesNotContain("sensitive provider detail", "private-test-bucket");
            });
    }

    @ParameterizedTest
    @ValueSource(strings = {"original-malformed", "result-malformed", "original-delete", "result-delete", "age-delete"})
    @SuppressWarnings("unchecked")
    void oneBadObjectDoesNotPreventOtherDueObjectsButStillReportsFailure(String scenario) {
        var storage = mock(Storage.class);
        var page = (Page<Blob>) mock(Page.class);
        var now = Instant.parse("2026-10-09T00:00:00Z");
        var prefix = scenario.startsWith("original") ? OriginalObjectKey.PREFIX
            : scenario.startsWith("result") ? ResultObjectKey.PREFIX : "private/";
        var key = scenario.startsWith("original") ? OriginalObjectKey.create(now.minusSeconds(1), 1)
            : scenario.startsWith("result") ? ResultObjectKey.create(now, "webp") : "private/valid";
        var good = blob(key, now.minusSeconds(3601));
        var bad = blob(scenario.endsWith("malformed") ? prefix + "v1/invalid/sensitive-key" : prefix + "legacy-bad", now.minusSeconds(3601));
        when(storage.list("private-test-bucket", BlobListOption.prefix(prefix))).thenReturn(page);
        when(page.iterateAll()).thenReturn(List.of(bad, good));
        if (scenario.endsWith("delete")) when(storage.delete(bad.getBlobId())).thenThrow(new StorageException(503, "sensitive detail"));
        when(storage.delete(good.getBlobId())).thenReturn(true);
        var adapter = new GoogleCloudStorageAdapter(storage, "private-test-bucket");
        assertThatThrownBy(() -> {
            if (scenario.startsWith("original")) adapter.deleteExpiredOriginals(now);
            else if (scenario.startsWith("result")) adapter.deleteExpiredResults(now);
            else adapter.deleteOlderThan(now);
        }).isInstanceOfSatisfying(GatewayException.class, error -> {
            assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
            assertThat(error.getCause()).isNull();
            assertThat(error.getMessage()).doesNotContain("sensitive", prefix, "private-test-bucket");
        });
        verify(storage).delete(good.getBlobId());
        if (scenario.endsWith("malformed")) verify(storage, never()).delete(bad.getBlobId());
    }

    @Test @SuppressWarnings("unchecked")
    void incompleteEnumerationNeverAcknowledgesPartialDeletionOrRetriesListing() {
        var storage = mock(Storage.class);
        var page = (Page<Blob>) mock(Page.class);
        var now = Instant.parse("2026-10-09T00:00:00Z");
        var good = blob(ResultObjectKey.create(now, "webp"), now.minusSeconds(1));
        when(storage.list("private-test-bucket", BlobListOption.prefix(ResultObjectKey.PREFIX))).thenReturn(page);
        when(page.iterateAll()).thenReturn(() -> new Iterator<Blob>() {
            boolean consumed;
            public boolean hasNext() { if (consumed) throw new StorageException(503, "private enumeration detail"); return true; }
            public Blob next() { if (consumed) throw new NoSuchElementException(); consumed = true; return good; }
        });
        when(storage.delete(good.getBlobId())).thenReturn(true);
        assertThatThrownBy(() -> new GoogleCloudStorageAdapter(storage, "private-test-bucket").deleteExpiredResults(now))
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getCause()).isNull();
                assertThat(error.getMessage()).doesNotContain("enumeration", "private");
            });
        verify(storage).delete(good.getBlobId());
        verify(storage).list("private-test-bucket", BlobListOption.prefix(ResultObjectKey.PREFIX));
    }

    @Test @SuppressWarnings("unchecked")
    void missingLegacyTimestampIsUnresolvedButValidDeadlineAndForeignScopesStayIndependent() {
        var storage = mock(Storage.class);
        var page = (Page<Blob>) mock(Page.class);
        var now = Instant.parse("2026-10-09T00:00:00Z");
        var legacy = mock(Blob.class);
        when(legacy.getBlobId()).thenReturn(BlobId.of("private-test-bucket", "private/rendering/legacy"));
        var good = mock(Blob.class);
        when(good.getBlobId()).thenReturn(BlobId.of("private-test-bucket", ResultObjectKey.create(now, "webp")));
        var foreign = mock(Blob.class);
        when(foreign.getBlobId()).thenReturn(BlobId.of("other-bucket", ResultObjectKey.create(now, "webp")));
        var outside = blob("public/outside", now.minusSeconds(4000));
        when(storage.list("private-test-bucket", BlobListOption.prefix(ResultObjectKey.PREFIX))).thenReturn(page);
        when(page.iterateAll()).thenReturn(List.of(legacy, good, foreign, outside));
        when(storage.delete(good.getBlobId())).thenReturn(true);
        assertThatThrownBy(() -> new GoogleCloudStorageAdapter(storage, "private-test-bucket").deleteExpiredResults(now)).isInstanceOf(GatewayException.class);
        verify(storage).delete(good.getBlobId());
        verify(storage, never()).delete(legacy.getBlobId());
        verify(storage, never()).delete(foreign.getBlobId());
        verify(storage, never()).delete(outside.getBlobId());
    }
}
