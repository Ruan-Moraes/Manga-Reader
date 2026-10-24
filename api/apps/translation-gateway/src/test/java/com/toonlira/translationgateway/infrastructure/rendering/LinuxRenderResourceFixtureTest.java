package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class LinuxRenderResourceFixtureTest {
    @Test
    void nativeResourceProbeAddsOnlyPinnedLibrariesAndExplicitNativeAccess() {
        var command = LinuxRenderContainerFixture.nativeProbeArguments("probe", "501:20", Path.of("/jar"),
            Path.of("/codecs"), Path.of("/source"), Path.of("/export"), Path.of("/probe"),
            new LinuxRenderContainerFixture.ProbeBudget(1024, 256, 64 * 1024), Path.of("/libraries"));
        assertThat(command).contains("--network=none", "--read-only", "--memory=1024m", "--memory-swap=1024m",
            "--enable-native-access=ALL-UNNAMED", "-Xmx256m", "type=bind,src=/libraries,dst=/build/install/lib,readonly",
            "-Dloader.main=" + NativeRenderResourceProbe.class.getName());
        assertThat(command).doesNotContain("--privileged", "--env", "--env-file", "--publish", "--volume");
    }
    @Test
    void resourceProbeKeepsInputsReadOnlyAndScratchCappedWithoutHostOrCredentialMounts() {
        var budget = new LinuxRenderContainerFixture.ProbeBudget(4096, 1024, 512 * 1024);
        var command = LinuxRenderContainerFixture.probeArguments("probe", "501:20", Path.of("/jar"),
            Path.of("/codecs"), Path.of("/source"), Path.of("/export"), Path.of("/probe-classes"), budget);
        assertThat(command).contains("--memory=4096m", "--memory-swap=4096m", "--network=none",
            "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--pids-limit=64", "--cpus=1");
        assertThat(command).contains("/work:rw,noexec,nosuid,nodev,size=524288k,mode=1777",
            "type=bind,src=/export/request.bin,dst=/inputs/request.bin,readonly",
            "type=bind,src=/source,dst=/original,readonly", "type=bind,src=/probe-classes,dst=/probe,readonly",
            "type=bind,src=/export,dst=/export", "-Xmx1024m", "-Djava.io.tmpdir=/work");
        assertThat(command).doesNotContain("type=bind,src=/export,dst=/work", "--privileged", "--env",
            "--env-file", "--volume", "--publish", "--oom-kill-disable");
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 63, 4097})
    void resourceBudgetMustNotBeUnbounded(int memoryMiB) {
        assertThatThrownBy(() -> new LinuxRenderContainerFixture.ProbeBudget(memoryMiB, 512, 16))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("linux-render-test-configuration").hasNoCause();
    }

    @Test
    void invalidHeapScratchOrStatusIsRejectedWithoutRawDiagnostics() {
        assertThatThrownBy(() -> new LinuxRenderContainerFixture.ProbeBudget(1024, 0, 16))
            .hasMessage("linux-render-test-configuration");
        assertThatThrownBy(() -> new LinuxRenderContainerFixture.ProbeBudget(1024, 512, 0))
            .hasMessage("linux-render-test-configuration");
        assertThatThrownBy(() -> new LinuxRenderContainerFixture.ProbeBudget(1024, 512, 1_048_577))
            .hasMessage("linux-render-test-configuration");
        for (var json : new String[] {"bad sensitive diagnostic", "{}", "{\"exitCode\":0,\"oomKilled\":\"false\"}",
            "{\"exitCode\":0,\"oomKilled\":false,\"raw\":\"private\"}"}) {
            assertThatThrownBy(() -> LinuxRenderContainerFixture.probeState(json))
                .hasMessage("linux-render-test-configuration").hasNoCause();
        }
        assertThat(LinuxRenderContainerFixture.probeState("{\"exitCode\":137,\"oomKilled\":true}").exitCode()).isEqualTo(137);
    }
}
