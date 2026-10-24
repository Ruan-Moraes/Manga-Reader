package com.toonlira.translationgateway.infrastructure.rendering;

import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;
import java.time.Duration;

/** Test-only: actual package admission and existing exact-alpha codec checks, without Spring or credentials. */
public final class NativeCodecDistributionProbe {
    private NativeCodecDistributionProbe() { }
    public static void main(String[] arguments) throws Exception {
        if (arguments.length != 2) throw new AssertionError("native-distribution-probe-configuration");
        var settings = NativeCodecDistribution.admitForRuntime(Path.of("/relocated/lib"), arguments[0], Duration.ofSeconds(60));
        NativeWebpCodecProbe.main(new String[]{settings.library().toString(), settings.librarySha256(),
            settings.sharpLibrary().toString(), settings.sharpSha256(), arguments[1]});
        Files.writeString(Path.of(arguments[1]).resolve("native-platform.txt"), NativeCodecPlatform.runtime().manifestId(),
            StandardOpenOption.CREATE_NEW);
    }
}
