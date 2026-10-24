package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.ByteBuffer;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;

class LinuxRenderContainerFixtureTest {
    @TempDir Path temporary;

    @Test
    void supportLibrariesRemainPinnedToTheGatewayStackBeforeDocker() throws Exception {
        assertThat(LinuxRenderContainerFixture.supportJar(MockMvc.class,
            "6ce8fc116f5d309b9ac50a6738bd1b15ea4012a4a5563c0ee89b795bfc9af0dc")).isRegularFile();
        assertThat(LinuxRenderContainerFixture.supportJar(SecurityMockMvcConfigurers.class,
            "85a8804e13e47186c86ce224954645b20df9d340e8c000e158050adc61c61d5a")).isRegularFile();
        assertThatThrownBy(() -> LinuxRenderContainerFixture.supportJar(MockMvc.class, "0".repeat(64)))
            .hasMessage("linux-render-test-configuration").hasNoCause();
    }

    @Test
    void localCommandCannotPullUseNetworkCredentialsOrMountTheWorkspace() {
        var arguments = LinuxRenderContainerFixture.createArguments("render-linux-test", "501:20",
            Path.of("/test.jar"), Path.of("/codec-bin"), Path.of("/source.png"), Path.of("/staging"),
            "java", List.of("-version"));
        assertThat(arguments).containsSubsequence("create", "--name", "render-linux-test", "--pull=never");
        assertThat(arguments).contains("--network=none", "--read-only", "--cap-drop=ALL",
            "--security-opt=no-new-privileges", "--pids-limit=64", "--memory=1g", "--memory-swap=1g", "--cpus=1");
        assertThat(arguments).containsSubsequence("--user", "501:20", "--workdir", "/work");
        assertThat(arguments).contains("type=bind,src=/test.jar,dst=/app/gateway.jar,readonly",
            "type=bind,src=/codec-bin,dst=/codecs,readonly", "type=bind,src=/source.png,dst=/original,readonly",
            "type=bind,src=/staging,dst=/work");
        assertThat(arguments).doesNotContain("--privileged", "--publish", "--env-file", "--volume");
        assertThat(arguments).containsSubsequence("--entrypoint", "java", LinuxRenderContainerFixture.IMAGE, "-version");
    }

    @Test void nestedProbeClassesUseTheirBinaryResourceNameAndAreNeverSilentlyMissing() throws Exception {
        for (var type : new Class<?>[]{NativeRenderingWorkerProbe.class, NativeRenderingWorkerProbe.Providers.class,
                NativeRenderingWorkerProbe.Providers.SyntheticOcr.class}) {
            var bytes = LinuxRenderContainerFixture.classBytes(type);
            assertThat(bytes).hasSizeGreaterThan(4);
            assertThat(ByteBuffer.wrap(bytes).getInt()).isEqualTo(0xcafebabe);
        }
        assertThatThrownBy(() -> LinuxRenderContainerFixture.classBytes(int.class))
            .hasMessage("linux-render-test-configuration").hasNoCause();
    }

    @Test void workerMeasurementsHaveOnlyFiniteExplicitLocalBudgets() {
        assertThat(LinuxRenderContainerFixture.workerMemoryMiB(null)).isEqualTo(2048);
        assertThat(LinuxRenderContainerFixture.workerMemoryMiB("2048")).isEqualTo(2048);
        assertThat(LinuxRenderContainerFixture.workerMemoryMiB("4096")).isEqualTo(4096);
        for (String invalid : List.of("", "0", "1024", "8192", "4g", " 4096", "2147483647")) {
            assertThatThrownBy(() -> LinuxRenderContainerFixture.workerMemoryMiB(invalid))
                .hasMessage("linux-render-test-configuration").hasNoCause();
        }
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"tcp://localhost:2375", "https://example.com", "unix://relative.sock", "unix:///tmp/../other.sock"})
    void onlyExplicitLocalUnixDaemonIsAccepted(String endpoint) {
        assertThatThrownBy(() -> LinuxRenderContainerFixture.validateEndpoint(endpoint))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("linux-render-test-configuration").hasNoCause();
    }

    @Test
    void unixEndpointIsNotTakenFromTheUsersDockerContext() {
        assertThat(LinuxRenderContainerFixture.validateEndpoint("unix:///tmp/local-daemon.sock"))
            .isEqualTo("unix:///tmp/local-daemon.sock");
    }

    @Test
    void binariesArePinnedBeforeAnyDockerOperation() throws Exception {
        var file = Files.writeString(temporary.resolve("cwebp"), "not the authorized binary");
        assertThatThrownBy(() -> LinuxRenderContainerFixture.requireBinary(file, LinuxRenderContainerFixture.ENCODER_SHA256))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("linux-render-test-configuration").hasNoCause();
        var alias = Files.createSymbolicLink(temporary.resolve("alias"), file);
        assertThatThrownBy(() -> LinuxRenderContainerFixture.requireBinary(alias, LinuxRenderContainerFixture.ENCODER_SHA256))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("linux-render-test-configuration").hasNoCause();
    }

    @Test
    void localMulticallDockerLauncherKeepsItsArgvNameWhileCodecAliasesRemainRejected() throws Exception {
        var executable = Files.writeString(temporary.resolve("docker-tools"), "fixture only");
        Files.setPosixFilePermissions(executable, java.nio.file.attribute.PosixFilePermissions.fromString("rwx------"));
        var alias = Files.createSymbolicLink(temporary.resolve("docker"), executable);
        assertThat(LinuxRenderContainerFixture.requireDocker(alias)).isEqualTo(alias);
    }
}
