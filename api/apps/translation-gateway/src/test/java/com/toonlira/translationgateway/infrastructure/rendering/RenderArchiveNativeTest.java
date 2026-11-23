package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.List;
import java.util.jar.JarFile;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Explicit packaged-artifact gate, no Spring startup, credentials, real text or network. */
@EnabledIfSystemProperty(named = "renderer.archive.enabled", matches = "true")
class RenderArchiveNativeTest {
    @TempDir Path temporary;

    @BeforeAll static void requireCurrentArchive() throws Exception {
        var classes = Path.of("target/classes").toRealPath();
        try (var jar = new JarFile(archive().toFile()); var files = Files.walk(classes)) {
            for (var file : files.filter(Files::isRegularFile).toList()) {
                var entry = jar.getEntry("BOOT-INF/classes/" + classes.relativize(file).toString().replace('\\', '/'));
                assertThat(entry).as("package must include every current main class/resource").isNotNull();
                try (var actual = jar.getInputStream(entry); var expected = Files.newInputStream(file)) {
                    assertThat(digest(actual)).as("package must match current compiled main classes/resources")
                        .containsExactly(digest(expected));
                }
            }
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"})
    void bootChildIsEquivalentForEveryDestinationAndIgnoresExternalLoaderConfiguration(String target) throws Exception {
        IsolatedRenderAdapterNativeTest.assertEquivalent(temporary, adapter(), target);
    }

    @ParameterizedTest
    @ValueSource(strings = {"png", "webp"})
    void bootChildPreservesEmptyPage(String format) throws Exception {
        IsolatedRenderAdapterNativeTest.assertEmpty(temporary, adapter(), format);
    }

    private IsolatedRenderAdapter adapter() {
        return new IsolatedRenderAdapter(temporary, IsolatedRenderAdapterNativeTest.settings(), Duration.ofSeconds(60), 768,
            (directory, heap) -> {
                // If PropertiesLauncher consults cwd this starts Spring or adds business arguments and the test fails.
                Files.writeString(directory.resolve("loader.properties"),
                    "loader.main=com.toonlira.translationgateway.TranslationGatewayApplication\n"
                        + "loader.args=unexpected-business-argument\nloader.path=/missing-private-path\n");
                return RenderJvmLauncher.builder(directory, heap, RenderChildMain.class.getName(), List.of(archive())).start();
            });
    }

    private static Path archive() {
        return Path.of(System.getProperty("renderer.archive.path", "target/translation-gateway-0.0.1-SNAPSHOT.jar"))
            .toAbsolutePath();
    }

    private static byte[] digest(InputStream stream) throws Exception {
        var digest = MessageDigest.getInstance("SHA-256");
        var buffer = new byte[8192];
        int count;
        while ((count = stream.read(buffer)) != -1) digest.update(buffer, 0, count);
        return digest.digest();
    }
}
