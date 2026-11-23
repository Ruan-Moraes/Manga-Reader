package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.ocr.VolatileLoopbackVisionFactory;
import com.toonlira.translationgateway.infrastructure.translation.VolatileLoopbackTranslationFactory;
import java.awt.Color;
import java.awt.Font;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.util.List;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.testcontainers.containers.BindMode;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.startupcheck.OneShotStartupCheckStrategy;

/** Synthetic visual review artifacts are written exclusively by the client, in a separate output mount. */
@Tag("native-linux")
@EnabledIfSystemProperty(named = "renderer.volatile.visual.enabled", matches = "true")
class VolatileVisualImageLinuxTest {
    @TempDir Path temporary;
    @Test @Timeout(300)
    void sevenTargetsEmptyAndOverflowAreDeliveredToClientWithoutServerContentFiles() throws Exception {
        String image = System.getProperty("renderer.native.image.arm64.id", "");
        assertThat(image).matches("sha256:[a-f0-9]{64}");
        var output = Path.of(System.getProperty("renderer.volatile.visual.evidence", ""));
        assertThat(output.isAbsolute()).isTrue();
        Files.createDirectories(output.getParent());
        Files.createDirectory(output);
        Files.setPosixFilePermissions(output, PosixFilePermissions.fromString("rwxrwxrwx"));
        var classes = Files.createDirectory(temporary.resolve("probe"));
        Files.setPosixFilePermissions(classes, PosixFilePermissions.fromString("rwxr-xr-x"));
        for (var type : List.of(VolatileGatewayIntegrationProbe.class, VolatileVisualIntegrationClient.class,
            VolatileOwnedFaultProbe.class, VolatileLoopbackVisionFactory.class, VolatileLoopbackTranslationFactory.class)) VolatileGatewayImageLinuxTest.mountClass(classes, type);
        var inputs = Files.createDirectory(temporary.resolve("inputs"));
        Files.setPosixFilePermissions(inputs, PosixFilePermissions.fromString("rwxr-xr-x"));
        fixture(inputs.resolve("visual.png"), true); fixture(inputs.resolve("empty.png"), false);
        for (String name : List.of("visual.png", "empty.png")) {
            Files.setPosixFilePermissions(inputs.resolve(name), PosixFilePermissions.fromString("rw-r--r--"));
            Files.copy(inputs.resolve(name), output.resolve("original-" + name));
        }
        var network = Network.builder().createNetworkCmdModifier(command -> command.withInternal(true)).build();
        var database = VolatileGatewayImageLinuxTest.metadataDatabase(network);
        var server = VolatileGatewayImageLinuxTest.volatileServer(image, classes, network)
            .withEnv("GATEWAY_TRANSLATION_ENABLED_PAIRS", "ja:pt-BR,ja:en,ja:es,en:ja,ja:ko,ja:zh-Hans,ja:zh-Hant");
        var client = VolatileGatewayImageLinuxTest.baseContainer(image, classes, network, VolatileVisualIntegrationClient.class, 256, 512, 32)
            .withFileSystemBind(inputs.toString(), "/inputs", BindMode.READ_ONLY)
            .withFileSystemBind(output.toString(), "/outputs", BindMode.READ_WRITE)
            .withStartupCheckStrategy(new OneShotStartupCheckStrategy().withTimeout(Duration.ofMinutes(3)));
        try {
            database.start(); server.start(); client.start();
            assertThat(client.getCurrentContainerInfo().getState().getExitCodeLong()).isZero();
            var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(output.resolve("metrics.json")));
            assertThat(metrics.path("ocrCalls").intValue()).isEqualTo(9);
            assertThat(metrics.path("translationCalls").intValue()).isEqualTo(8);
            assertThat(metrics.path("contentFiles").intValue()).isZero();
            assertThat(metrics.path("regularFiles").intValue()).isZero();
            assertThat(metrics.path("pidsEvents").asText().trim()).isEqualTo("max 0");
            assertThat(server.getLogs()).doesNotContain(VolatileGatewayIntegrationProbe.SOURCE, "Bearer ",
                "pthread_create failed", "Failed to start thread", "unable to create native thread");
            for (String target : List.of("pt-BR", "en", "es", "ja", "ko", "zh-Hans", "zh-Hant", "empty", "overflow"))
                assertThat(output.resolve("render-" + target + ".webp")).isRegularFile();
            System.out.println("volatile-visual-integrated: " + metrics);
        } finally {
            try {
                Files.writeString(output.resolve("server-operational.log"), logs(server), StandardOpenOption.CREATE_NEW);
                Files.writeString(output.resolve("client-operational.log"), logs(client), StandardOpenOption.CREATE_NEW);
            } finally {
                try { client.close(); }
                finally { try { server.close(); } finally { try { database.close(); } finally { network.close(); Files.setPosixFilePermissions(output, PosixFilePermissions.fromString("rwx------")); } } }
            }
        }
    }
    private static String logs(org.testcontainers.containers.GenericContainer<?> container) {
        try { return container.getContainerId() == null ? "not-created" : container.getLogs(); }
        catch (RuntimeException error) { return "operational-log-unavailable:" + error.getClass().getSimpleName(); }
    }
    private static void fixture(Path target, boolean text) throws Exception {
        var image = new BufferedImage(960, 1280, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        try {
            graphics.setColor(new Color(230, 236, 244)); graphics.fillRect(0, 0, 960, 1280);
            for (int y = 0; y < 1280; y += 64) {
                graphics.setColor(new Color(60 + y % 100, 110, 150)); graphics.fillRect(24, y + 10, 912, 20);
            }
            graphics.setColor(Color.BLACK); graphics.fillRect(88, 120, 784, 400);
            graphics.setColor(Color.WHITE); graphics.fillRect(92, 124, 776, 392);
            if (text) {
                graphics.setColor(Color.BLACK); graphics.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 28));
                graphics.drawString(VolatileGatewayIntegrationProbe.SOURCE, 130, 320);
            }
            graphics.setColor(new Color(250, 190, 65)); graphics.fillOval(96, 650, 300, 300);
            graphics.setColor(new Color(65, 150, 140)); graphics.fillRoundRect(480, 650, 340, 400, 48, 48);
            assertThat(ImageIO.write(image, "PNG", target.toFile())).isTrue();
        } finally { graphics.dispose(); image.flush(); }
    }
}
