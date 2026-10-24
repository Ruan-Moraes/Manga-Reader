package com.toonlira.translationgateway.domain.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.SupportedLanguages;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationResult;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.AbstractList;
import java.util.List;
import java.util.Iterator;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

class RenderingContractsTest {
    private static final UUID JOB = UUID.randomUUID();
    private static final String HASH = "a".repeat(64);
    private static final String OCR_HASH = "b".repeat(64);
    private static final String TRANSLATION_HASH = "c".repeat(64);
    private static final String OUTPUT_HASH = "d".repeat(64);
    private static final String TEXT = "  日本語 中文 한글 café 😀 <script>alert('fixture')</script>\nlinha  ";
    private static final RenderPolicy POLICY = RenderPolicy.initial();

    @Test void compressionPolicyIsVersionedWithoutChangingVisualOrMediaLimits() {
        assertThat(POLICY.version()).isEqualTo("clean-box-1.1");
        assertThat(POLICY.compressionMethod()).isZero();
        var legacy = new RenderPolicy("clean-box-1.0", POLICY.maxOriginalBytes(), POLICY.maxWidthPx(), POLICY.maxHeightPx(),
            POLICY.maxPixels(), POLICY.maxOutputBytes(), POLICY.maxManifestBytes(), POLICY.minimumFontPx(), POLICY.maximumFontPx(), POLICY.paddingPx());
        assertThat(legacy.compressionMethod()).isEqualTo(4);
        assertThat(POLICY.encoding()).isEqualTo(legacy.encoding()).isEqualTo("webp-lossless");
        assertThat(POLICY.maxPixels()).isEqualTo(80_000_000);
        assertThat(POLICY.maxOutputBytes()).isEqualTo(64L * 1024 * 1024);
        assertThat(POLICY.minimumFontPx()).isEqualTo(12); assertThat(POLICY.maximumFontPx()).isEqualTo(48);
        assertThat(POLICY.paddingPx()).isEqualTo(2);
    }

    @ParameterizedTest
    @MethodSource("targets")
    void preservesAllSevenTargetsAndExactTextWithoutChangingOcr(String target) {
        var pair = new LanguagePair(target.equals("pt-BR") ? "en" : "pt-BR", target);
        var ocr = ocr(pair.source(), List.of(region(UUID.randomUUID(), 0, "origem\n")));
        var request = request(ocr, translated(ocr, pair, TEXT));
        var manifest = RenderManifest.create(request, image(100),
            List.of(new RenderManifest.Placement(ocr.regions().getFirst().id(), false, 20)));

        assertThat(request.pair()).isEqualTo(pair);
        assertThat(request.regions().getFirst().translatedText()).isEqualTo(TEXT);
        assertThat(manifest.targetLanguage()).isEqualTo(target);
        assertThat(manifest.regions().getFirst().sourceText()).isEqualTo("origem\n");
        assertThat(manifest.regions().getFirst().translatedText()).isEqualTo(TEXT);
        assertThat(manifest.regions().getFirst().polygon()).isEqualTo(ocr.regions().getFirst().polygon());
        assertThat(ocr.regions().getFirst().sourceText()).isEqualTo("origem\n");
    }

    @Test
    void keepsFullOverflowTextAndRestoresPlacementOrderById() {
        var ocr = ocr("ja", List.of(region(UUID.randomUUID(), 0, "一"), region(UUID.randomUUID(), 1, "二")));
        var request = request(ocr, translated(ocr, new LanguagePair("ja", "pt-BR"), TEXT));
        var manifest = RenderManifest.create(request, image(100), List.of(
            new RenderManifest.Placement(ocr.regions().get(1).id(), true, 0),
            new RenderManifest.Placement(ocr.regions().get(0).id(), false, POLICY.minimumFontPx())));

        assertThat(manifest.regions()).extracting(RenderManifest.Region::id)
            .containsExactly(ocr.regions().get(0).id(), ocr.regions().get(1).id());
        assertThat(manifest.regions().get(1).overflow()).isTrue();
        assertThat(manifest.regions().get(1).translatedText()).isEqualTo(TEXT);
        assertThat(manifest.regions().get(1).fontSizePx()).isZero();
        assertThat(manifest.regions()).extracting(RenderManifest.Region::readingOrder).containsExactly(0, 1);
    }

    @Test
    void emptyPageOnlyAcceptsEmptyPlacementsWithoutInventingRegion() {
        var ocr = ocr("ja", List.of());
        var request = request(ocr, translated(ocr, new LanguagePair("ja", "pt-BR"), "unused"));
        assertThat(RenderManifest.create(request, image(100), List.of()).regions()).isEmpty();
        invalidOutput(() -> RenderManifest.create(request, image(100),
            List.of(new RenderManifest.Placement(UUID.randomUUID(), true, 0))));
    }

    @Test
    void copiesAllCallerOwnedCollectionsAndNeverExposesSensitiveRepresentations() {
        var polygon = new ArrayList<>(polygon());
        var inputRegions = new ArrayList<>(List.of(new OcrManifest.Region(UUID.randomUUID(), 0, TEXT, polygon)));
        var ocr = ocr("ja", inputRegions);
        var request = request(ocr, translated(ocr, new LanguagePair("ja", "pt-BR"), TEXT));
        var placements = new ArrayList<>(List.of(new RenderManifest.Placement(inputRegions.getFirst().id(), true, 0)));
        var manifest = RenderManifest.create(request, image(100), placements);
        RenderPort.Output output = new RenderPort.Output(Path.of("/private/sensitive-output.webp"), manifest);
        polygon.clear();
        inputRegions.clear();
        placements.clear();

        assertThat(request.regions()).hasSize(1);
        assertThat(request.regions().getFirst().polygon()).hasSize(4);
        assertThat(manifest.regions()).hasSize(1);
        assertThat(manifest.regions().getFirst().polygon()).hasSize(4);
        assertThatThrownBy(() -> request.regions().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> request.regions().getFirst().polygon().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> manifest.regions().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> manifest.regions().getFirst().polygon().clear()).isInstanceOf(UnsupportedOperationException.class);
        for (var value : List.of(request, request.source(), request.regions().getFirst(), manifest,
            manifest.image(), manifest.regions().getFirst(), output)) {
            assertThat(value.toString()).doesNotContain(TEXT, JOB.toString(), HASH, OCR_HASH,
                TRANSLATION_HASH, OUTPUT_HASH, "sensitive-output");
        }
    }

    @Test
    void snapshotsCallerOwnedRegionsBeforeValidatingOrReadingThemAgain() {
        var id = UUID.randomUUID();
        var reads = new AtomicInteger();
        var original = region(id, 0, "verified source");
        List<OcrManifest.Region> mutable = new AbstractList<>() {
            @Override public OcrManifest.Region get(int index) {
                return reads.getAndIncrement() == 0 ? original : region(id, 0, "changed after validation");
            }
            @Override public int size() { return 1; }
        };
        var translation = translated(ocr("ja", List.of(original)), new LanguagePair("ja", "pt-BR"), TEXT);
        assertThat(request(ocr("ja", mutable), translation).regions().getFirst().sourceText()).isEqualTo("verified source");
    }

    @ParameterizedTest
    @MethodSource("badPolygons")
    void rejectsInvalidOrOutOfImageGeometryWithoutClampingOcrSilently(List<OcrManifest.Vertex> points) {
        var ocr = ocr("ja", List.of(new OcrManifest.Region(UUID.randomUUID(), 0, "text", points)));
        invalidInput(() -> request(ocr, translated(ocr, new LanguagePair("ja", "pt-BR"), TEXT)));
    }

    @Test
    void rejectsWrongJobLanguageOrderIdentityAndMissingInputs() {
        var valid = ocr("ja", List.of(region(UUID.randomUUID(), 0, "source")));
        var result = translated(valid, new LanguagePair("ja", "pt-BR"), TEXT);
        invalidInput(() -> request(new OcrManifest("1.0", UUID.randomUUID(), "ja", 100, 80, valid.regions()), result));
        invalidInput(() -> request(ocr("zh-Hant", valid.regions()), result));
        invalidInput(() -> request(ocr("ja", List.of(region(UUID.randomUUID(), 0, "source"))), result));
        invalidInput(() -> request(ocr("ja", List.of(region(valid.regions().getFirst().id(), 1, "source"))), result));
        invalidInput(() -> request(new OcrManifest("2.0", JOB, "ja", 100, 80, valid.regions()), result));
        invalidInput(() -> request(new OcrManifest("1.0", JOB, "ja", 101, 80, valid.regions()), result));
        invalidInput(() -> request(new OcrManifest("1.0", JOB, "ja", 100, 80, null), result));
        invalidInput(() -> request(ocr("ja", List.of()), result));
        invalidInput(() -> request(null, result));
        invalidInput(() -> request(valid, null));
        invalidInput(() -> RenderRequest.create(null, valid, result, OCR_HASH, TRANSLATION_HASH, POLICY));
        invalidInput(() -> RenderRequest.create(source(100, 80, 100), valid, result, null, TRANSLATION_HASH, POLICY));
        invalidInput(() -> RenderRequest.create(source(100, 80, 100), valid, result, OCR_HASH, "A".repeat(64), POLICY));
        invalidInput(() -> RenderRequest.create(source(100, 80, 100), valid, result, OCR_HASH, TRANSLATION_HASH, null));
    }

    @Test
    void rejectsNullDuplicateBlankAndOversizedSourceRegionsWithoutRawCauses() {
        var id = UUID.randomUUID();
        var valid = ocr("ja", List.of(region(id, 0, "source")));
        var result = translated(valid, new LanguagePair("ja", "pt-BR"), TEXT);
        invalidInput(() -> request(ocr("ja", List.of(region(id, 0, " \n\t"))), result));
        invalidInput(() -> request(ocr("ja", List.of(region(id, 0, null))), result));
        invalidInput(() -> request(ocr("ja", List.of(region(null, 0, "source"))), result));
        invalidInput(() -> request(ocr("ja", List.of(region(id, 0, "x".repeat(4097)))), result));
        invalidInput(() -> request(ocr("ja", List.of(region(id, 0, "source"), region(id, 1, "source"))), result));
        var withNull = new ArrayList<OcrManifest.Region>();
        withNull.add(null);
        invalidInput(() -> request(ocr("ja", withNull), result));
    }

    @ParameterizedTest
    @ValueSource(strings = {"x", "😀"})
    void preservesExactUtf16TextLimitsWithoutTruncation(String unit) {
        var ocr = ocr("ja", List.of(region(UUID.randomUUID(), 0, unit.repeat(4096 / unit.length()))));
        var target = unit.repeat(8192 / unit.length());
        var request = request(ocr, translated(ocr, new LanguagePair("ja", "pt-BR"), target));
        var manifest = RenderManifest.create(request, image(100),
            List.of(new RenderManifest.Placement(ocr.regions().getFirst().id(), true, 0)));
        assertThat(request.regions().getFirst().sourceText()).hasSize(4096);
        assertThat(manifest.regions().getFirst().translatedText()).isEqualTo(target).hasSize(8192);
    }

    @Test
    void validatesTotalAndCountLimitsAtTheBoundary() {
        var regions = new ArrayList<OcrManifest.Region>();
        for (int i = 0; i < 64; i++) regions.add(region(UUID.randomUUID(), i, "x".repeat(4096)));
        var exact = ocr("ja", regions);
        assertThat(request(exact, translated(exact, new LanguagePair("ja", "pt-BR"), "x".repeat(8192))).regions()).hasSize(64);
        regions.add(region(UUID.randomUUID(), 64, "x"));
        var above = ocr("ja", regions);
        invalidInput(() -> request(above, translated(above, new LanguagePair("ja", "pt-BR"), "short")));
        regions.clear();
        for (int i = 0; i < 1024; i++) regions.add(region(UUID.randomUUID(), i, "x"));
        var many = ocr("ja", regions);
        var result = translated(many, new LanguagePair("ja", "pt-BR"), "x");
        assertThat(request(many, result).regions()).hasSize(1024);
        regions.add(region(UUID.randomUUID(), 1024, "x"));
        invalidInput(() -> request(ocr("ja", regions), result));
    }

    @Test
    void respectsVerifiedMediaDimensionsBytesAndStricterCapabilitySnapshot() {
        var empty = new OcrManifest("1.0", JOB, "ja", 10_000, 8_000, List.of());
        var result = translated(empty, new LanguagePair("ja", "pt-BR"), "unused");
        assertThat(RenderRequest.create(source(10_000, 8_000, POLICY.maxOriginalBytes()), empty,
            result, OCR_HASH, TRANSLATION_HASH, POLICY).regions()).isEmpty();
        invalidInput(() -> RenderRequest.create(source(10_001, 8_000, 100), empty, result, OCR_HASH, TRANSLATION_HASH, POLICY));
        invalidInput(() -> RenderRequest.create(source(10_000, 8_000, POLICY.maxOriginalBytes() + 1), empty,
            result, OCR_HASH, TRANSLATION_HASH, POLICY));
        var abovePixels = new OcrManifest("1.0", JOB, "ja", 10_001, 8_000, List.of());
        invalidInput(() -> RenderRequest.create(source(10_001, 8_000, 100), abovePixels,
            translated(abovePixels, new LanguagePair("ja", "pt-BR"), "unused"), OCR_HASH, TRANSLATION_HASH, POLICY));
        var exactAxis = new OcrManifest("1.0", JOB, "ja", 12_000, 1, List.of());
        assertThat(RenderRequest.create(source(12_000, 1, 100), exactAxis,
            translated(exactAxis, new LanguagePair("ja", "pt-BR"), "unused"), OCR_HASH, TRANSLATION_HASH, POLICY).regions()).isEmpty();
        var aboveAxis = new OcrManifest("1.0", JOB, "ja", 12_001, 1, List.of());
        invalidInput(() -> RenderRequest.create(source(12_001, 1, 100), aboveAxis,
            translated(aboveAxis, new LanguagePair("ja", "pt-BR"), "unused"), OCR_HASH, TRANSLATION_HASH, POLICY));
        var narrow = new RenderPolicy("test-1.0", 99, 100, 80, 8_000, 100, 1000, 12, 48, 2);
        var small = ocr("ja", List.of());
        invalidInput(() -> RenderRequest.create(source(100, 80, 100), small,
            translated(small, new LanguagePair("ja", "pt-BR"), "unused"), OCR_HASH, TRANSLATION_HASH, narrow));
    }

    @Test
    void rejectsMissingDuplicateExtraAndUnsafeFontPlacements() {
        var ocr = ocr("ja", List.of(region(UUID.randomUUID(), 0, "一"), region(UUID.randomUUID(), 1, "二")));
        var request = request(ocr, translated(ocr, new LanguagePair("ja", "pt-BR"), TEXT));
        var first = new RenderManifest.Placement(ocr.regions().getFirst().id(), false, 12);
        var second = new RenderManifest.Placement(ocr.regions().get(1).id(), false, 48);
        invalidOutput(() -> RenderManifest.create(request, image(100), null));
        invalidOutput(() -> RenderManifest.create(request, image(100), List.of(first)));
        invalidOutput(() -> RenderManifest.create(request, image(100), List.of(first, first)));
        invalidOutput(() -> RenderManifest.create(request, image(100), List.of(first, second, new RenderManifest.Placement(UUID.randomUUID(), true, 0))));
        invalidOutput(() -> RenderManifest.create(request, image(100), List.of(first, new RenderManifest.Placement(UUID.randomUUID(), true, 0))));
        invalidOutput(() -> RenderManifest.create(request, image(100), List.of(first, new RenderManifest.Placement(null, true, 0))));
        invalidOutput(() -> RenderManifest.create(request, image(100), List.of(first, new RenderManifest.Placement(second.regionId(), false, 11))));
        invalidOutput(() -> RenderManifest.create(request, image(100), List.of(first, new RenderManifest.Placement(second.regionId(), false, 49))));
        invalidOutput(() -> RenderManifest.create(request, image(100), List.of(first, new RenderManifest.Placement(second.regionId(), true, 12))));
        var withNull = new ArrayList<RenderManifest.Placement>();
        withNull.add(first);
        withNull.add(null);
        invalidOutput(() -> RenderManifest.create(request, image(100), withNull));
    }

    @Test
    void rejectsExcessPlacementsIfCollectionChangesAfterItsSizeWasChecked() {
        var ocr = ocr("ja", List.of(region(UUID.randomUUID(), 0, "source")));
        var request = request(ocr, translated(ocr, new LanguagePair("ja", "pt-BR"), TEXT));
        var first = new RenderManifest.Placement(ocr.regions().getFirst().id(), true, 0);
        var extra = new RenderManifest.Placement(UUID.randomUUID(), true, 0);
        List<RenderManifest.Placement> changed = new AbstractList<>() {
            @Override public RenderManifest.Placement get(int index) { return first; }
            @Override public int size() { return 1; }
            @Override public Iterator<RenderManifest.Placement> iterator() { return List.of(first, extra).iterator(); }
        };
        invalidOutput(() -> RenderManifest.create(request, image(100), changed));
    }

    @Test
    void validatesFinalWebpMetadataAgainstRequestButDoesNotPretendToReadBytes() {
        var ocr = ocr("ja", List.of());
        var request = request(ocr, translated(ocr, new LanguagePair("ja", "pt-BR"), "unused"));
        assertThat(RenderManifest.create(request, image(POLICY.maxOutputBytes()), List.of()).image().sha256()).isEqualTo(OUTPUT_HASH);
        invalidOutput(() -> RenderManifest.create(request, image(POLICY.maxOutputBytes() + 1), List.of()));
        invalidOutput(() -> RenderManifest.create(request, new RenderedImage("image/webp", 100, 101, 80, OUTPUT_HASH), List.of()));
        invalidOutput(() -> RenderManifest.create(request, null, List.of()));
        invalidOutput(() -> RenderManifest.create(null, image(100), List.of()));
        invalidOutput(() -> new RenderedImage("image/png", 100, 100, 80, OUTPUT_HASH));
        invalidOutput(() -> new RenderedImage("image/webp", 0, 100, 80, OUTPUT_HASH));
        invalidOutput(() -> new RenderedImage("image/webp", 100, 0, 80, OUTPUT_HASH));
        invalidOutput(() -> new RenderedImage("image/webp", 100, 100, 80, null));
        invalidOutput(() -> new RenderPort.Output(null, RenderManifest.create(request, image(100), List.of())));
    }

    @Test
    void rejectsInvalidSourceAndPolicyWithOnlySanitizedInternalFailures() {
        invalidInput(() -> new RenderSource("image/gif", 100, 100, 80, HASH));
        invalidInput(() -> new RenderSource("image/png", 0, 100, 80, HASH));
        invalidInput(() -> new RenderSource("image/png", 100, -1, 80, HASH));
        invalidInput(() -> new RenderSource("image/png", 100, 100, 80, "invalid"));
        invalidInput(() -> new RenderSource(null, 100, 100, 80, HASH));
        invalidInput(() -> new RenderSource("image/png", 100, 100, 0, HASH));
        invalidInput(() -> new RenderSource("image/png", 100, 100, 80, null));
        assertThat(POLICY.encoding()).isEqualTo("webp-lossless");
        assertThatThrownBy(() -> new RenderPolicy("", 100, 100, 80, 8000, 100, 1000, 12, 48, 2))
            .isInstanceOf(RenderValidationException.class).hasMessage("INVALID_POLICY").hasNoCause();
        assertThatThrownBy(() -> new RenderPolicy("v1", 100, 100, 80, 8000, 100, 1000, 0, 48, 2))
            .isInstanceOf(RenderValidationException.class).hasMessage("INVALID_POLICY").hasNoCause();
        assertThatThrownBy(() -> new RenderPolicy("v1", 100, 100, 80, 8000, 100, 1000, 12, 11, 2))
            .isInstanceOf(RenderValidationException.class).hasMessage("INVALID_POLICY").hasNoCause();
        assertThatThrownBy(() -> new RenderPolicy("v1", 100, 100, 80, 8000, 100, 1000, 12, 48, -1))
            .isInstanceOf(RenderValidationException.class).hasMessage("INVALID_POLICY").hasNoCause();
    }

    @ParameterizedTest
    @MethodSource("invalidPolicies")
    void rejectsUnboundedOrNonPositivePolicySnapshots(Runnable constructor) {
        assertThatThrownBy(constructor::run).isInstanceOf(RenderValidationException.class)
            .hasMessage("INVALID_POLICY").hasNoCause();
    }

    private static Stream<Runnable> invalidPolicies() {
        return Stream.of(
            () -> new RenderPolicy(null, 100, 100, 80, 8000, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("private/reference", 100, 100, 80, 8000, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 0, 100, 80, 8000, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", POLICY.maxOriginalBytes() + 1, 100, 80, 8000, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 0, 80, 8000, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 12_001, 80, 8000, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 100, 0, 8000, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 100, 12_001, 8000, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 100, 80, 0, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 100, 80, POLICY.maxPixels() + 1, 100, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 100, 80, 8000, 0, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 100, 80, 8000, POLICY.maxOutputBytes() + 1, 1000, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 100, 80, 8000, 100, 0, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 100, 80, 8000, 100, POLICY.maxManifestBytes() + 1, 12, 48, 2),
            () -> new RenderPolicy("v1", 100, 100, 80, 8000, 100, 1000, 12, 12_001, 2),
            () -> new RenderPolicy("v1", 100, 100, 80, 8000, 100, 1000, 12, 48, 12_001));
    }

    private static Stream<String> targets() { return SupportedLanguages.CODES.stream(); }

    private static Stream<List<OcrManifest.Vertex>> badPolygons() {
        var nullPoint = new ArrayList<>(polygon());
        nullPoint.set(0, null);
        return Stream.of(null, List.of(), polygon().subList(0, 3), nullPoint,
            List.of(new OcrManifest.Vertex(-0.1, 0.1), polygon().get(1), polygon().get(2), polygon().get(3)),
            List.of(new OcrManifest.Vertex(Double.NaN, 0.1), polygon().get(1), polygon().get(2), polygon().get(3)),
            List.of(new OcrManifest.Vertex(0.1, Double.POSITIVE_INFINITY), polygon().get(1), polygon().get(2), polygon().get(3)),
            List.of(polygon().get(0), polygon().get(2), polygon().get(1), polygon().get(3)),
            List.of(polygon().get(0), polygon().get(1), new OcrManifest.Vertex(1.1, 0.8), polygon().get(3)),
            List.of(polygon().getFirst(), polygon().getFirst(), polygon().getFirst(), polygon().getFirst()));
    }

    private static List<OcrManifest.Vertex> polygon() {
        return List.of(new OcrManifest.Vertex(0.1, 0.1), new OcrManifest.Vertex(0.8, 0.1),
            new OcrManifest.Vertex(0.8, 0.8), new OcrManifest.Vertex(0.1, 0.8));
    }

    private static OcrManifest.Region region(UUID id, int order, String source) {
        return new OcrManifest.Region(id, order, source, polygon());
    }

    private static OcrManifest ocr(String source, List<OcrManifest.Region> regions) {
        return new OcrManifest("1.0", JOB, source, 100, 80, regions);
    }

    private static TranslationResult translated(OcrManifest ocr, LanguagePair pair, String text) {
        var request = new TranslationRequest(ocr.jobRef(), pair, ocr.regions().stream()
            .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), "synthetic source")).toList());
        var response = new TranslationResponse(ocr.regions().stream()
            .map(region -> new TranslationResponse.Region(region.id(), text)).toList());
        return new TranslationValidator(Set.of(pair)).validateResponse(request, response);
    }

    private static RenderRequest request(OcrManifest ocr, TranslationResult translated) {
        return RenderRequest.create(source(100, 80, 100), ocr, translated, OCR_HASH, TRANSLATION_HASH, POLICY);
    }

    private static RenderSource source(int width, int height, long bytes) {
        return new RenderSource("image/png", bytes, width, height, HASH);
    }

    private static RenderedImage image(long bytes) { return new RenderedImage("image/webp", bytes, 100, 80, OUTPUT_HASH); }

    private static void invalidInput(Runnable action) {
        assertThatThrownBy(action::run).isInstanceOf(RenderValidationException.class).hasMessage("INVALID_INPUT").hasNoCause();
    }

    private static void invalidOutput(Runnable action) {
        assertThatThrownBy(action::run).isInstanceOf(RenderValidationException.class).hasMessage("INVALID_OUTPUT").hasNoCause();
    }
}
