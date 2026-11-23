package com.toonlira.translationgateway.infrastructure.storage;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.google.cloud.storage.Storage;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.GatewayException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RetiredStorageWritesTest {
    @TempDir Path root;
    @Test void localAdapterCannotPersistEvenWhenSelectedByOldConfiguration() throws Exception {
        var properties = new GatewayProperties(); properties.getStorage().setLocalDirectory(root);
        var adapter = new LocalObjectStorageAdapter(properties);
        assertThatThrownBy(() -> adapter.store("private/page", Path.of("/must-not-read"), "image/png", "a".repeat(64), Instant.now()))
            .isInstanceOf(GatewayException.class).hasNoCause();
        try (var files = Files.list(root)) { assertThat(files).isEmpty(); }
    }
    @Test void cloudAdapterCannotWriteOrReadTheSuppliedImage() {
        var client = mock(Storage.class);
        var adapter = new GoogleCloudStorageAdapter(client, "private-fixture");
        assertThatThrownBy(() -> adapter.store("private/page", Path.of("/must-not-read"), "image/png", "a".repeat(64), Instant.now()))
            .isInstanceOf(GatewayException.class).hasNoCause();
        verifyNoInteractions(client);
    }
}
