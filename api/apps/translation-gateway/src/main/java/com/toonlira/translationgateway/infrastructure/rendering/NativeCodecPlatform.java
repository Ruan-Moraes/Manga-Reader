package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.nio.ByteOrder;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Explicit ELF/package targets. Selection neither loads native code nor establishes resource admission. */
enum NativeCodecPlatform {
    ARM64("linux-aarch64-musl", 183, "/lib/ld-musl-aarch64.so.1", "libc.musl-aarch64.so.1"),
    AMD64("linux-x86_64-musl", 62, "/lib/ld-musl-x86_64.so.1", "libc.musl-x86_64.so.1"),
    ARM64_GLIBC("linux-aarch64-glibc", 183, "/lib/ld-linux-aarch64.so.1", "libc.so.6", "libm.so.6", "ld-linux-aarch64.so.1"),
    AMD64_GLIBC("linux-x86_64-glibc", 62, "/lib64/ld-linux-x86-64.so.2", "libc.so.6", "libm.so.6");

    private final String manifestId, interpreter, libc;
    private final int machine;
    private final Set<String> sharpDependencies, webpDependencies;

    NativeCodecPlatform(String manifestId, int machine, String interpreter, String libc, String... otherDependencies) {
        this.manifestId = manifestId; this.machine = machine; this.interpreter = interpreter; this.libc = libc;
        var dependencies = new HashSet<>(Set.of(libc)); dependencies.addAll(List.of(otherDependencies));
        sharpDependencies = Set.copyOf(dependencies);
        dependencies.add("libsharpyuv.so.0"); webpDependencies = Set.copyOf(dependencies);
    }

    String manifestId() { return manifestId; }
    int machine() { return machine; }
    String libc() { return libc; }
    Set<String> sharpDependencies() { return sharpDependencies; }
    Set<String> webpDependencies() { return webpDependencies; }
    Map<String, String> childEnvironment() { return "libc.so.6".equals(libc) ? Map.of("MALLOC_ARENA_MAX", "2") : Map.of(); }

    void requireParentEnvironment(Map<String, String> environment) {
        if (!childEnvironment().isEmpty() && (environment == null || !"2".equals(environment.get("MALLOC_ARENA_MAX"))))
            throw new RenderFileException(CONFIGURATION);
    }

    static NativeCodecPlatform fromManifest(String value) {
        for (var platform : values()) if (platform.manifestId.equals(value)) return platform;
        throw new RenderFileException(CONFIGURATION);
    }

    static NativeCodecPlatform runtime() {
        int machine = runtimeMachine(System.getProperty("os.name"), System.getProperty("os.arch"),
            ByteOrder.nativeOrder(), Runtime.version().feature());
        return runtime(System.getProperty("os.name"), System.getProperty("os.arch"),
            ByteOrder.nativeOrder(), Runtime.version().feature(), NativeRuntimeElf.interpreter(Path.of("/proc/self/exe"), machine));
    }

    static NativeCodecPlatform runtime(String os, String architecture, ByteOrder order, int javaVersion, String interpreter) {
        int machine = runtimeMachine(os, architecture, order, javaVersion);
        for (var platform : values()) if (platform.machine == machine && platform.interpreter.equals(interpreter)) return platform;
        throw new RenderFileException(CONFIGURATION);
    }

    private static int runtimeMachine(String os, String architecture, ByteOrder order, int javaVersion) {
        if (!"Linux".equals(os) || order != ByteOrder.LITTLE_ENDIAN || javaVersion != 25)
            throw new RenderFileException(CONFIGURATION);
        if ("aarch64".equals(architecture)) return 183;
        if ("amd64".equals(architecture) || "x86_64".equals(architecture)) return 62;
        throw new RenderFileException(CONFIGURATION);
    }
}
