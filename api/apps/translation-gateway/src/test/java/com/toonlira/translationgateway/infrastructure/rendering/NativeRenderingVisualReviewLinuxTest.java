package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.application.RenderManifestService;
import com.toonlira.translationgateway.domain.SupportedLanguages;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/** Direct renderer gallery, not worker/provider quality or cloud memory admission. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.visual.enabled", matches = "true")
class NativeRenderingVisualReviewLinuxTest {
    private static Path destination;
    @TempDir Path temporary;

    @BeforeAll static void reserveExclusiveGallery() throws Exception {
        RenderArchiveNativeTest.requireCurrentArchive();
        destination = Path.of(System.getProperty("renderer.visual.directory"));
        assertThat(destination.isAbsolute()).isTrue();
        assertThat(destination.normalize()).isEqualTo(destination);
        assertThat(destination.getParent().toRealPath()).isEqualTo(destination.getParent());
        assertThat(Files.isDirectory(destination.getParent(), LinkOption.NOFOLLOW_LINKS)).isTrue();
        assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(destination.getParent()))).isEqualTo("rwx------");
        Files.createDirectory(destination, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
    }

    @ParameterizedTest
    @EnumSource(value = NativeCodecPlatform.class, names = {"ARM64_GLIBC", "AMD64_GLIBC"})
    void savesSevenVerifiedSyntheticPagesForIndependentVisualReview(NativeCodecPlatform target) throws Exception {
        String architecture = target == NativeCodecPlatform.ARM64_GLIBC ? "arm64" : "amd64";
        String image = System.getProperty("renderer.native.image." + architecture + ".id");
        var distribution = NativeCodecDistribution.admit(NativeCodecGlibcLinuxTest.distribution(target),
            NativeCodecGlibcLinuxTest.pin(target), Duration.ofSeconds(60));
        var settings = new NativeRenderChildSettings(Path.of("/relocated/lib/libwebp.so.7"), distribution.librarySha256(),
            Path.of("/relocated/lib/libsharpyuv.so.0"), distribution.sharpSha256(), Duration.ofSeconds(60));
        var platformDirectory = Files.createDirectory(destination.resolve(architecture));
        for (String language : SupportedLanguages.CODES) {
            var directory = Files.createDirectory(platformDirectory.resolve(language));
            var original = directory.resolve("original.png");
            var artwork = VisualRenderingFixture.image();
            try { assertThat(ImageIO.write(artwork, "png", original.toFile())).isTrue(); }
            finally { artwork.flush(); }
            var source = LocalFileRenderAdapterTest.metadata(original);
            var request = VisualRenderingFixture.request(source, language);
            var work = Files.createDirectory(directory.resolve("work"));
            RenderSubprocessProtocol.writeRequest(work.resolve("request.bin"), Path.of("/original"),
                new BoundedNativeRenderChildSettings(settings, NativeProcessLimits.initial()), request);
            var decodedDirectory = Files.createDirectory(directory.resolve("decoded"));
            try (var fixture = new LinuxRenderContainerFixture(temporary)) {
                fixture.nativeImageVisualRender(original, work, image);
                var output = RenderSubprocessProtocol.readResult(work.resolve("result.bin"), work, request);
                assertThat(output.manifest().regions().stream().map(region -> region.overflow())).containsExactly(false, false, false, true);
                var imageFile = Files.move(output.path(), directory.resolve("rendered.webp"));
                assertThat(WebpProcessCodecTest.digest(imageFile)).isEqualTo(output.manifest().image().sha256());
                fixture.decode(imageFile, decodedDirectory);
                var decodedFile = Files.move(decodedDirectory.resolve("decoded.png"), directory.resolve("decoded.png"));
                int changed = verifyPixels(original, decodedFile);
                assertThat(changed).isGreaterThan(100);
                assertThat(WebpProcessCodecTest.digest(original)).isEqualTo(source.sha256());
                var service = new RenderManifestService(GatewayJsonMapper.create());
                var manifest = service.encode(output.manifest(), request.policy());
                assertThat(service.decode(manifest.bytes(), manifest.sha256(), request, output.manifest().image()).regions())
                    .containsExactlyElementsOf(output.manifest().regions());
                Files.write(directory.resolve("manifest.json"), manifest.bytes(), StandardOpenOption.CREATE_NEW);
                var metadata = new LinkedHashMap<String, Object>();
                metadata.put("format", "rendering-visual-case-1"); metadata.put("architecture", architecture);
                metadata.put("targetLanguage", language); metadata.put("imageId", image);
                metadata.put("syntheticInputs", true); metadata.put("syntheticBindingHashes", true);
                metadata.put("workerIntegrationTest", false); metadata.put("realProviderCalls", 0);
                metadata.put("humanReview", "pending"); metadata.put("changedPixels", changed);
                metadata.put("outsidePolygonChanges", 0); metadata.put("widthPx", source.widthPx()); metadata.put("heightPx", source.heightPx());
                metadata.put("files", List.of("original.png", "rendered.webp", "decoded.png", "manifest.json").stream()
                    .collect(Collectors.toMap(name -> name, name -> {
                        try { return WebpProcessCodecTest.digest(directory.resolve(name)); }
                        catch (Exception unavailable) { throw new IllegalStateException("visual-review-unavailable"); }
                    })));
                Files.write(directory.resolve("case.json"), GatewayJsonMapper.create().writeValueAsBytes(metadata), StandardOpenOption.CREATE_NEW);
                System.out.println("synthetic-visual-render " + architecture + " " + language + ": verified-not-human-approved");
            }
        }
    }

    private static int verifyPixels(Path original, Path rendered) throws Exception {
        var before = ImageIO.read(original.toFile()); var after = ImageIO.read(rendered.toFile());
        try {
            assertThat(after.getWidth()).isEqualTo(VisualRenderingFixture.WIDTH); assertThat(after.getHeight()).isEqualTo(VisualRenderingFixture.HEIGHT);
            var shapes = VisualRenderingFixture.polygons().stream().map(VisualRenderingFixture::shape).toList();
            int changed = 0, outsideChanges = 0;
            for (int y = 0; y < before.getHeight(); y++) for (int x = 0; x < before.getWidth(); x++) {
                boolean permitted = false;
                for (var shape : shapes) if (shape.contains(x + .5, y + .5)) { permitted = true; break; }
                if (before.getRGB(x, y) != after.getRGB(x, y)) { if (!permitted) outsideChanges++; changed++; }
            }
            assertThat(outsideChanges).isZero();
            return changed;
        } finally { before.flush(); after.flush(); }
    }
}
