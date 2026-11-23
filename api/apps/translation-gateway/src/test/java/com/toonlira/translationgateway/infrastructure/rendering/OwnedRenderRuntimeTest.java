package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class OwnedRenderRuntimeTest {
    @TempDir Path parent;
    @Test void cleansPrivateRuntimeAssetsWithoutFollowingLinksOutsideOwnedDirectory() throws Exception {
        var outside = Files.createDirectory(parent.resolve("outside"));
        var sentinel = Files.writeString(outside.resolve("public-font.fixture"), "synthetic public font runtime asset");
        var runtime = OwnedRenderRuntime.create(parent);
        assertThat(Files.getPosixFilePermissions(runtime.directory())).isEqualTo(PosixFilePermissions.fromString("rwx------"));
        Files.writeString(Files.createDirectory(runtime.directory().resolve("font-cache")).resolve("runtime.fixture"), "technical asset");
        Files.createSymbolicLink(runtime.directory().resolve("external"), outside);
        runtime.close();
        assertThat(runtime.directory()).doesNotExist();
        assertThat(sentinel).hasContent("synthetic public font runtime asset");
    }
}
