package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.env.MapPropertySource;

/** Slim real worker renderer configuration, not a full worker/DB/resource admission. Parent has no native access. */
public final class NativeWorkerConfigurationProbe {
    private NativeWorkerConfigurationProbe() { }
    public static void main(String[] arguments) throws Exception {
        if (arguments.length != 2) throw new AssertionError("native-worker-probe-configuration");
        var exported = Path.of(arguments[1]); var work = Path.of("/work"); var original = work.resolve("synthetic.png");
        var image = new BufferedImage(13, 17, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < 17; y++) for (int x = 0; x < 13; x++) image.setRGB(x, y, 0xffaaccee);
        try { if (!ImageIO.write(image, "png", original.toFile())) throw new AssertionError(); } finally { image.flush(); }
        var before = Files.readAllBytes(original);
        var inspector = new MediaInspectionService(); MediaInspectionService.InspectedMedia media;
        try (var input = Files.newInputStream(original)) { media = inspector.inspect(input, RenderPolicy.MAX_ORIGINAL_BYTES); }
        var source = new RenderSource(media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(), media.sha256());
        Files.delete(media.path());
        var pair = new LanguagePair("en", "pt-BR"); var job = new UUID(0, 1);
        var translation = new TranslationValidator(Set.of(pair)).validateResponse(new TranslationRequest(job, pair, List.of()),
            new TranslationResponse(List.of()));
        var request = RenderRequest.create(source, new OcrManifest("1.0", job, "en", 13, 17, List.of()), translation,
            "a".repeat(64), "b".repeat(64), RenderPolicy.initial());
        var properties = new GatewayProperties(); var configuration = properties.getRendering();
        configuration.setMode(GatewayProperties.Rendering.Mode.SUPERVISED_NATIVE);
        configuration.setTemporaryDirectory(work); configuration.setNativeDistribution(Path.of("/relocated/lib"));
        configuration.setNativeDistributionSha256(arguments[0]);
        try (var context = new AnnotationConfigApplicationContext()) {
            context.getEnvironment().setActiveProfiles("worker");
            context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("local-probe",
                Map.of("gateway.rendering.mode", "supervised-native")));
            context.registerBean(GatewayProperties.class, () -> properties);
            context.register(NativeRenderingConfiguration.class); context.refresh();
            var renderer = context.getBean(RenderPort.class);
            if (!(renderer instanceof IsolatedRenderAdapter)) throw new AssertionError("unexpected-renderer");
            var result = renderer.render(original, request);
            Files.copy(result.path(), exported.resolve("configured.webp")); Files.delete(result.path());
            if (!result.manifest().regions().isEmpty() || !Arrays.equals(before, Files.readAllBytes(original)))
                throw new AssertionError("native-worker-output-invalid");
        }
        Files.delete(original);
        Files.writeString(exported.resolve("native-platform.txt"), NativeCodecPlatform.runtime().manifestId(), StandardOpenOption.CREATE_NEW);
        try (var entries = Files.list(work)) {
            if (entries.anyMatch(file -> file.getFileName().toString().startsWith("render-")))
                throw new AssertionError("native-worker-staging-leak");
        }
    }
}
