package com.toonlira.translationgateway.infrastructure.rendering;

import java.nio.file.Files;
import java.nio.file.Path;

public final class RenderingSessionDirectoryProbe {
    public static void main(String[] args) throws Exception {
        var root = Path.of("").toAbsolutePath().toRealPath();
        var directory = RenderingSessionDirectory.create(root);
        if (Files.readString(root.resolve("phase")).equals("abandon")) {
            Files.writeString(directory.resolve("original.bin"), "synthetic");
            Files.writeString(root.resolve("abandoned"), directory.toString());
            Runtime.getRuntime().halt(0);
        }
        IsolatedRenderAdapter.deleteDirectory(directory);
    }
}
