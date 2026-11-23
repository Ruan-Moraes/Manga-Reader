package com.toonlira.translationgateway.infrastructure.layout;

import com.toonlira.translationgateway.domain.layout.LayoutManifest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public final class ComicDetectorModel {
    public static final String NAME = "ogkalu/comic-text-and-bubble-detector";
    public static final String REVISION = "16e8a622f91fabc6b5b65c96d32d1183f8843546";
    public static final String SHA256 = "065744e91c0594ad8663aa8b870ce3fb27222942eded5a3cc388ce23421bd195";
    public static final String RUNTIME = "onnxruntime-java-1.24.2-cpu";
    public static final int INPUT_SIZE = 640;
    public static final LayoutManifest.Model METADATA = new LayoutManifest.Model(NAME, REVISION, SHA256, "Apache-2.0", RUNTIME);

    private ComicDetectorModel() { }

    public static void verify(Path path) {
        try {
            if (path == null || !Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)) throw invalid();
            var digest = MessageDigest.getInstance("SHA-256");
            try (var input = Files.newInputStream(path)) {
                byte[] buffer = new byte[65536];
                int length;
                while ((length = input.read(buffer)) != -1) digest.update(buffer, 0, length);
            }
            if (!SHA256.equals(HexFormat.of().formatHex(digest.digest()))) throw invalid();
        } catch (IOException | NoSuchAlgorithmException error) { throw invalid(); }
    }

    private static IllegalStateException invalid() { return new IllegalStateException("Layout model missing or invalid"); }
}
