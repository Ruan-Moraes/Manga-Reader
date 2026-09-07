package com.toonlira.translationgateway.infrastructure.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.BlobWriteOption;
import java.io.InputStream;
import java.nio.file.Files;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;

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
}
