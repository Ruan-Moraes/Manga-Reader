package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.InMemoryMedia;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Client-side synthetic test-fixture preparation only. Never included in the server JAR. */
public final class VolatileWebpFixtureProbe {
    private VolatileWebpFixtureProbe() { }
    public static void main(String[] arguments) {
        try {
            if (arguments.length != 1) throw new IllegalArgumentException();
            generate(Path.of("/original"), Path.of("/work/fixture.webp"), arguments[0]);
        } catch (Throwable error) { System.exit(1); }
    }
    static void generate(Path input, Path destination, String manifestHash) throws Exception {
        byte[] original = null;
        try {
            LinuxNativeProcessGuard.apply(NativeProcessLimits.initial());
            var policy = RenderPolicy.initial();
            original = Files.readAllBytes(input);
            var source = InMemoryMedia.inspect(original, policy);
            var job = UUID.randomUUID(); var pair = new LanguagePair("en", "pt-BR");
            var ocr = new OcrManifest("1.0", job, pair.source(), source.widthPx(), source.heightPx(), List.of());
            var translation = new TranslationValidator(Set.of(pair)).validateResponse(
                new TranslationRequest(job, pair, List.of()), new TranslationResponse(List.of()));
            var request = RenderRequest.create(source, ocr, translation, "a".repeat(64), "b".repeat(64), policy);
            var settings = NativeCodecDistribution.admitForRuntime(Path.of("/relocated/lib"), manifestHash, Duration.ofSeconds(60));
            try (var codec = new NativeWebpCodec(settings.library(), settings.librarySha256(), settings.sharpLibrary(),
                    settings.sharpSha256(), settings.nativeTimeout());
                 var raster = new NativeArgbRaster(source.widthPx(), source.heightPx(), policy)) {
                NativeMemoryRenderAdapter.decode(original, request, raster);
                var encoded = codec.encodeMemory(raster, policy);
                try {
                    if (encoded.length > policy.maxOriginalBytes()) throw new IllegalStateException();
                    Files.write(destination, encoded, StandardOpenOption.CREATE_NEW);
                } finally { Arrays.fill(encoded, (byte) 0); }
            }
        } finally { if (original != null) Arrays.fill(original, (byte) 0); }
    }
}
