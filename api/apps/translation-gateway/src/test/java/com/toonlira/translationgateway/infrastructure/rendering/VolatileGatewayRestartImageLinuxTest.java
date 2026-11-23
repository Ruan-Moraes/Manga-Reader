package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.infrastructure.ocr.VolatileLoopbackVisionFactory;
import com.toonlira.translationgateway.infrastructure.translation.VolatileLoopbackTranslationFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.testcontainers.containers.BindMode;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.startupcheck.IsRunningStartupCheckStrategy;
import org.testcontainers.containers.wait.strategy.Wait;

/** Restarts the real server process, retaining only metadata PostgreSQL and the independent client. */
@Tag("native-linux")
@EnabledIfSystemProperty(named = "renderer.volatile.restart.enabled", matches = "true")
class VolatileGatewayRestartImageLinuxTest {
    @TempDir Path temporary;
    @Test @Timeout(300)
    void metadataSurvivesActualServerRestartWithoutContentRecoveryOrPaidReplay() throws Exception {
        String image = System.getProperty("renderer.native.image.arm64.id", "");
        assertThat(image).matches("sha256:[a-f0-9]{64}");
        var classes = Files.createDirectory(temporary.resolve("probe"));
        Files.setPosixFilePermissions(classes, PosixFilePermissions.fromString("rwxr-xr-x"));
        for (var type : List.of(VolatileGatewayIntegrationProbe.class, VolatileGatewayIntegrationClient.class,
            VolatileGatewayRestartClient.class, VolatileOwnedFaultProbe.class, VolatileLoopbackVisionFactory.class, VolatileLoopbackTranslationFactory.class))
            VolatileGatewayImageLinuxTest.mountClass(classes, type);
        var inputs = Files.createDirectory(temporary.resolve("inputs"));
        Files.setPosixFilePermissions(inputs, PosixFilePermissions.fromString("rwxr-xr-x"));
        var original = SyntheticResourcePng.multicolor(inputs.resolve("small.png"), 320, 220);
        Files.setPosixFilePermissions(original, PosixFilePermissions.fromString("rw-r--r--"));
        var network = Network.builder().createNetworkCmdModifier(command -> command.withInternal(true)).build();
        var database = VolatileGatewayImageLinuxTest.metadataDatabase(network);
        var server = VolatileGatewayImageLinuxTest.volatileServer(image, classes, network);
        var client = VolatileGatewayImageLinuxTest.baseContainer(image, classes, network, VolatileGatewayRestartClient.class, 256, 512, 32)
            .withFileSystemBind(inputs.toString(), "/inputs", BindMode.READ_ONLY)
            .withStartupCheckStrategy(new IsRunningStartupCheckStrategy())
            .waitingFor(Wait.forLogMessage(".*volatile-restart-client-awaiting-restart.*\\n", 1).withStartupTimeout(Duration.ofSeconds(90)));
        try {
            database.start(); server.start(); client.start();
            server.getDockerClient().restartContainerCmd(server.getContainerId()).withTimeout(1).exec();
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(180);
            while (Boolean.TRUE.equals(client.getCurrentContainerInfo().getState().getRunning())) {
                assertThat(System.nanoTime()).as("restart client deadline; %s", client.getLogs()).isLessThan(deadline);
                Thread.sleep(100);
            }
            assertThat(client.getCurrentContainerInfo().getState().getExitCodeLong()).as("restart client: %s", client.getLogs()).isZero();
            assertThat(client.getLogs()).contains("volatile-restart-client-result:");
            assertThat(server.getLogs()).doesNotContain(VolatileGatewayIntegrationProbe.SOURCE, "Bearer ", "pthread_create failed");
            System.out.println(client.getLogs().lines().filter(line -> line.startsWith("volatile-restart-client-result:")).findFirst().orElseThrow());
        } finally {
            try {
                var evidence = Path.of(System.getProperty("renderer.volatile.restart.evidence", temporary.toString()));
                Files.createDirectories(evidence);
                if (server.getContainerId() != null) Files.writeString(evidence.resolve("server-operational.log"), server.getLogs(), StandardOpenOption.CREATE_NEW);
                if (client.getContainerId() != null) Files.writeString(evidence.resolve("client-operational.log"), client.getLogs(), StandardOpenOption.CREATE_NEW);
            } finally {
                try { client.close(); }
                finally { try { server.close(); } finally { try { database.close(); } finally { network.close(); } } }
            }
        }
    }
}
