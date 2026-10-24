package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.LinkedHashMap;

/** Local measurement only: no worker wiring, Spring context, HTTP, ADC or provider. */
public final class NativeRenderResourceProbe {
    private static final Path WORK = Path.of("/work"), EXPORT = Path.of("/export");
    private NativeRenderResourceProbe() { }

    public static void main(String[] arguments) {
        long started = System.nanoTime();
        String outcome = "failed", failure = "render-unavailable", phase = "preparation";
        RenderSource source = null;
        boolean exact = false;
        Path snapshot = null, encoded = null;
        boolean bounded = arguments.length == 1;
        var details = new LinkedHashMap<String, Object>();
        details.put("codec", "native-ffm-experimental");
        try {
            if (arguments.length > 2 || arguments.length == 2 && !"0".equals(arguments[1])
                || !"Linux".equals(System.getProperty("os.name"))) throw new IllegalArgumentException();
            bounded = arguments.length > 0;
            var input = RenderSubprocessProtocol.readRequest(Path.of("/inputs/request.bin"));
            var request = input.request(); source = request.source();
            int method = request.policy().compressionMethod();
            if (arguments.length == 2 && method != 0) throw new IllegalArgumentException();
            if (bounded) {
                details.put("compressionMethod", method); details.put("experimentalEncoding", arguments.length == 2);
                details.put("policyVersion", request.policy().version());
            }
            NativeRenderChildSettings settings = null;
            PageRasterPainter preparedPainter = null;
            if (bounded) {
                var admitted = NativeCodecDistribution.admitForRuntime(Path.of("/relocated/lib"), arguments[0], Duration.ofSeconds(60));
                if (!(input.settings() instanceof BoundedNativeRenderChildSettings limits) || !limits.codec().equals(admitted))
                    throw new IllegalArgumentException();
                long address = limits.limits().addressSpaceBytes();
                var initial = NativeProcessLimits.initial();
                if (address != initial.addressSpaceBytes() && address != 4L * 1024 * 1024 * 1024
                    || limits.limits().cpuSeconds() != initial.cpuSeconds() || limits.limits().fileBytes() != initial.fileBytes()
                    || limits.limits().openFiles() != initial.openFiles()) throw new IllegalArgumentException();
                details.put("largerAddressDiagnostic", address != initial.addressSpaceBytes());
                details.put("childHeapMaximumBytes", Runtime.getRuntime().maxMemory());
                settings = admitted;
                phase = "guard"; checkpoint(phase);
                LinuxNativeProcessGuard.apply(limits.limits());
                details.put("childAddressSpaceLimitBytes", LinuxWorkerMemoryAdmission.addressLimit(control("/proc/self/limits", 4096)));
                phase = "fonts"; checkpoint(phase);
                preparedPainter = new PageRasterPainter(new BundledRenderingFonts());
            }
            var inspector = new MediaInspectionService();
            MediaInspectionService.InspectedMedia media;
            try (var stream = Files.newInputStream(input.original())) { media = inspector.inspect(stream, request.policy().maxOriginalBytes()); }
            snapshot = media.path();
            if (!new RenderSource(media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(), media.sha256()).equals(source))
                throw new RenderFileException(RenderFileException.Failure.INVALID_MEDIA);
            RenderManifest manifest;
            var target = EXPORT.resolve("render-probe.webp");
            try (var codec = settings == null ? new NativeWebpCodec(Path.of("/build/install/lib/libwebp.so.7.2.0"),
                    "ae9bd6f135c9ccd5de96cacc19b155f5c646bf3362c6d39086f4b1e1df427eb8", Path.of("/build/install/lib/libsharpyuv.so.0.1.2"),
                    "f7ef39823cce822098b53a516262b07490a42f69522de1ff5aa9db73232fa457", Duration.ofSeconds(60))
                    : new NativeWebpCodec(settings.library(), settings.librarySha256(), settings.sharpLibrary(), settings.sharpSha256(), settings.nativeTimeout());
                 var raster = new NativeArgbRaster(source.widthPx(), source.heightPx(), request.policy())) {
                phase = "decode"; long phaseStart = System.nanoTime();
                if (bounded) { checkpoint(phase); details.put("virtualBeforeDecodeBytes", virtualBytes()); }
                new ValidatedRasterDecoder(null).decodeInto(media, request.policy(), raster);
                details.put("decodeNanos", System.nanoTime() - phaseStart);
                phase = "paint"; phaseStart = System.nanoTime();
                if (bounded) { checkpoint(phase); details.put("virtualAfterDecodeBytes", virtualBytes()); }
                var placements = (preparedPainter == null ? new PageRasterPainter(new BundledRenderingFonts()) : preparedPainter).paint(raster.image(), request);
                details.put("paintNanos", System.nanoTime() - phaseStart);
                var digest = MessageDigest.getInstance("SHA-256"); digest.update(raster.pixels().asByteBuffer());
                byte[] pixels = digest.digest();
                phase = "encode"; phaseStart = System.nanoTime();
                if (bounded) { checkpoint(phase); details.put("virtualBeforeEncodeBytes", virtualBytes()); }
                var artifact = codec.encode(raster, WORK, request.policy()); encoded = artifact.path();
                details.put("encodeNanos", System.nanoTime() - phaseStart);
                manifest = RenderManifest.create(request, artifact.image(), placements);
                phase = "verify"; phaseStart = System.nanoTime();
                if (bounded) { checkpoint(phase); details.put("virtualAfterEncodeBytes", virtualBytes()); }
                codec.decodeInto(encoded, artifact.image(), request.policy(), raster);
                digest.update(raster.pixels().asByteBuffer());
                if (!MessageDigest.isEqual(pixels, digest.digest())) throw new RenderFileException(RenderFileException.Failure.UNAVAILABLE);
                exact = true; details.put("verifyNanos", System.nanoTime() - phaseStart);
                Files.copy(encoded, target); Files.delete(encoded); encoded = null;
            }
            Files.delete(snapshot); snapshot = null;
            phase = "export";
            RenderSubprocessProtocol.writeResult(EXPORT.resolve("result.bin"), new RenderPort.Output(target, manifest));
            details.put("outputBytes", manifest.image().byteSize());
            details.put("outputSha256", manifest.image().sha256());
            outcome = "succeeded"; failure = null; phase = "complete";
        } catch (Throwable error) {
            details.put("failureType", error.getClass().getSimpleName());
            if (error instanceof RenderCodecException codecError && codecError.nativeFailure() != null)
                details.put("nativeFailure", codecError.nativeFailure().name());
            if (error instanceof RenderFileException || error instanceof RenderCodecException
                || error instanceof RenderPaintingException) failure = error.getMessage();
        } finally {
            try { if (encoded != null) Files.delete(encoded); if (snapshot != null) Files.delete(snapshot); }
            catch (Exception ignored) { outcome = "failed"; failure = "render-cleanup"; }
        }
        details.put("phase", phase); details.put("pixelRoundTripExact", exact && outcome.equals("succeeded"));
        try { RenderResourceMetrics.write(WORK, EXPORT, started, outcome, failure, source, details); }
        catch (Throwable ignored) { System.exit(2); }
        if (!outcome.equals("succeeded")) System.exit(1);
    }

    private static void checkpoint(String phase) throws Exception {
        Files.writeString(EXPORT.resolve("bounded-phases.txt"), phase + "\n",
            phase.equals("guard") ? StandardOpenOption.CREATE_NEW : StandardOpenOption.APPEND);
    }
    private static long virtualBytes() throws Exception {
        return LinuxWorkerMemoryAdmission.virtualBytes(control("/proc/self/status", 16384));
    }
    private static String control(String name, int limit) throws Exception {
        try (var input = Files.newInputStream(Path.of(name))) {
            var bytes = input.readNBytes(limit + 1);
            if (bytes.length > limit) throw new IllegalArgumentException();
            return new String(bytes, StandardCharsets.US_ASCII);
        }
    }
}
