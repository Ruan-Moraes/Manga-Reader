package com.toonlira.translationgateway.domain.translation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.INVALID_INPUT;
import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.INVALID_OUTPUT;
import static com.toonlira.translationgateway.domain.translation.TranslationValidationException.Failure.UNSUPPORTED_PAIR;

import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.domain.SupportedLanguages;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class TranslationValidatorTest {
    private static final UUID JOB = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final LanguagePair PAIR = new LanguagePair("ja", "pt-BR");
    private final TranslationValidator validator = new TranslationValidator(Set.of(PAIR));

    static Stream<LanguagePair> allPairs() { return LanguagePair.all().stream(); }

    @ParameterizedTest
    @MethodSource("allPairs")
    void acceptsEachOfTheFortyTwoDirectionalPairs(LanguagePair pair) {
        var request = new TranslationRequest(JOB, pair, List.of());
        new TranslationValidator(Set.of(pair)).validateRequest(request);
        assertThat(LanguagePair.all()).hasSize(42).doesNotHaveDuplicates();
        assertThat(SupportedLanguages.CODES).containsExactly("ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR");
        assertThat(pair.source()).isNotEqualTo(pair.target());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"zh", "zh-CN", "zh-TW", "pt", "PT-BR", "fr", " ja", "ja "})
    void rejectsUnknownCodesWithoutAliases(String language) {
        fails(() -> new LanguagePair(language, "en"), INVALID_INPUT);
        fails(() -> new LanguagePair("en", language), INVALID_INPUT);
    }

    @Test
    void rejectsIdenticalLanguagesAndDisabledPairsEvenForEmptyPages() {
        for (var language : SupportedLanguages.CODES) {
            fails(() -> new LanguagePair(language, language), INVALID_INPUT);
        }
        var empty = request(List.of());
        fails(() -> new TranslationValidator(Set.of()).validateRequest(empty), UNSUPPORTED_PAIR);
        fails(() -> validator.validateRequest(new TranslationRequest(JOB,
            new LanguagePair("pt-BR", "ja"), List.of())), UNSUPPORTED_PAIR);
        fails(() -> new TranslationValidator(null), INVALID_INPUT);
        fails(() -> new TranslationValidator(new HashSet<>(Arrays.asList(PAIR, null))), INVALID_INPUT);
        validator.validateRequest(empty);
        assertThat(validator.validateResponse(empty, new TranslationResponse(List.of())).regions()).isEmpty();
        fails(() -> validator.validateResponse(empty, response(translation(1, "extra"))), INVALID_OUTPUT);
    }

    @Test
    void validatesTheRequestAgainBeforeAcceptingAResponse() {
        fails(() -> new TranslationValidator(Set.of()).validateResponse(request(List.of()),
            new TranslationResponse(List.of())), UNSUPPORTED_PAIR);
        fails(() -> validator.validateResponse(null, new TranslationResponse(List.of())), INVALID_INPUT);
    }

    @ParameterizedTest
    @ValueSource(strings = {"zh-Hans", "zh-Hant", "pt-BR"})
    void preservesVariantInResultAndRejectsPairRemovedFromTheCurrentPolicy(String target) {
        var pair = new LanguagePair("en", target);
        var request = new TranslationRequest(JOB, pair, List.of(region(1, 0, "Name")));
        var policy = new TranslationValidator(Set.of(pair));
        var result = policy.validateResponse(request, response(translation(1, "Name")));
        assertThat(result.pair()).isEqualTo(pair);
        assertThat(result.pair().target()).isEqualTo(target);
        assertThat(result.regions().getFirst().translatedText()).isEqualTo("Name");
        fails(() -> new TranslationValidator(Set.of()).validateRequest(request), UNSUPPORTED_PAIR);
    }

    @Test
    void rejectsMissingRequestFieldsDuplicatesAndNonContiguousOrder() {
        fails(() -> validator.validateRequest(null), INVALID_INPUT);
        fails(() -> validator.validateRequest(new TranslationRequest(null, PAIR, List.of())), INVALID_INPUT);
        fails(() -> validator.validateRequest(new TranslationRequest(JOB, null, List.of())), INVALID_INPUT);
        fails(() -> request(null), INVALID_INPUT);
        fails(() -> request(Arrays.asList((TranslationRequest.Region) null)), INVALID_INPUT);
        fails(() -> validator.validateRequest(request(List.of(new TranslationRequest.Region(null, 0, "text")))), INVALID_INPUT);
        fails(() -> validator.validateRequest(request(List.of(region(1, 0, "a"), region(1, 1, "b")))), INVALID_INPUT);
        for (int order : new int[] {-1, 1, Integer.MAX_VALUE}) {
            fails(() -> validator.validateRequest(request(List.of(region(1, order, "a")))), INVALID_INPUT);
        }
        fails(() -> validator.validateRequest(request(List.of(region(1, 0, "a"), region(2, 0, "b")))), INVALID_INPUT);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\n\t", "\u3000"})
    void rejectsBlankTextWithoutInventingAnUntranslatableException(String text) {
        fails(() -> validator.validateRequest(request(List.of(region(1, 0, text)))), INVALID_INPUT);
        fails(() -> validator.validateResponse(single(), response(translation(1, text))), INVALID_OUTPUT);
    }

    @Test
    void rejectsMissingExtraDuplicateOrNullResponseFields() {
        var request = request(List.of(region(1, 0, "a"), region(2, 1, "b")));
        fails(() -> validator.validateResponse(request, null), INVALID_OUTPUT);
        fails(() -> new TranslationResponse(null), INVALID_OUTPUT);
        fails(() -> new TranslationResponse(Arrays.asList((TranslationResponse.Region) null)), INVALID_OUTPUT);
        fails(() -> validator.validateResponse(single(), response(new TranslationResponse.Region(null, "a"))), INVALID_OUTPUT);
        fails(() -> validator.validateResponse(request, response(translation(1, "a"))), INVALID_OUTPUT);
        fails(() -> validator.validateResponse(request, response(translation(1, "a"), translation(3, "b"))), INVALID_OUTPUT);
        fails(() -> validator.validateResponse(request, response(translation(1, "a"), translation(1, "b"))), INVALID_OUTPUT);
        fails(() -> validator.validateResponse(single(), response(translation(1, "a"), translation(2, "b"))), INVALID_OUTPUT);
    }

    @Test
    void preservesExactTextAndRestoresOnlyOrderAcrossTheTestOnlyPort() {
        String first = "  漢字😀\n<script>&á e\u0301</script>  ";
        String second = "同じ文章。";
        var request = request(List.of(region(1, 0, first), region(2, 1, second)));
        validator.validateRequest(request);
        var seen = new ArrayList<TranslationRequest>();
        TranslationPort fake = command -> {
            seen.add(command);
            return response(translation(2, second), translation(1, first));
        };
        var result = validator.validateResponse(request, fake.translate(request));
        assertThat(seen).containsExactly(request);
        assertThat(result.jobRef()).isEqualTo(JOB);
        assertThat(result.pair()).isEqualTo(PAIR);
        assertThat(result.regions()).extracting(TranslationResult.Region::id).containsExactly(id(1), id(2));
        assertThat(result.regions()).extracting(TranslationResult.Region::readingOrder).containsExactly(0, 1);
        assertThat(result.regions()).extracting(TranslationResult.Region::translatedText).containsExactly(first, second);
        assertThat(request.regions().getFirst().sourceText()).isEqualTo(first);
        var repeated = validator.validateResponse(request, response(translation(1, second), translation(2, second)));
        assertThat(repeated.regions()).hasSize(2);
    }

    @Test
    void enforcesRegionCountBoundaries() {
        var regions = sources(1024, "a");
        validator.validateRequest(request(regions));
        assertThat(validator.validateResponse(request(regions), translations(1024, "b")).regions()).hasSize(1024);
        fails(() -> validator.validateRequest(request(sources(1025, "a"))), INVALID_INPUT);
        fails(() -> validator.validateResponse(request(regions), translations(1025, "b")), INVALID_OUTPUT);
    }

    @ParameterizedTest
    @ValueSource(strings = {"a", "😀"})
    void countsUtf16UnitsAtPerRegionBoundaries(String unit) {
        String source = unit.repeat(4096 / unit.length());
        String target = unit.repeat(8192 / unit.length());
        var request = request(List.of(region(1, 0, source)));
        validator.validateRequest(request);
        assertThat(validator.validateResponse(request, response(translation(1, target))).regions().getFirst()
            .translatedText()).hasSize(8192);
        fails(() -> validator.validateRequest(request(List.of(region(1, 0, source + "a")))), INVALID_INPUT);
        fails(() -> validator.validateResponse(request, response(translation(1, target + "a"))), INVALID_OUTPUT);
    }

    @ParameterizedTest
    @ValueSource(strings = {"a", "😀"})
    void countsUtf16UnitsAtTotalBoundariesIndependently(String unit) {
        var regions = new ArrayList<>(sources(64, unit.repeat(4096 / unit.length())));
        validator.validateRequest(request(regions));
        regions.add(region(65, 64, "a"));
        fails(() -> validator.validateRequest(request(regions)), INVALID_INPUT);
        var request = request(sources(65, "a"));
        var output = new ArrayList<>(translations(64, unit.repeat(8192 / unit.length())).regions());
        String last = output.getLast().translatedText();
        output.set(63, translation(64, last.substring(0, last.length() - unit.length())));
        output.add(translation(65, unit));
        assertThat(validator.validateResponse(request, new TranslationResponse(output)).regions()).hasSize(65);
        output.set(64, translation(65, unit + "a"));
        fails(() -> validator.validateResponse(request, new TranslationResponse(output)), INVALID_OUTPUT);
    }

    @Test
    void copiesCollectionsAndDoesNotExposeSensitiveRepresentations() {
        var enabled = new HashSet<>(Set.of(PAIR));
        var localValidator = new TranslationValidator(enabled);
        enabled.clear();
        var input = new ArrayList<>(List.of(region(1, 0, "source-secret")));
        var request = request(input);
        input.clear();
        localValidator.validateRequest(request);
        var output = new ArrayList<>(List.of(translation(1, "target-secret")));
        var response = new TranslationResponse(output);
        output.clear();
        var result = localValidator.validateResponse(request, response);
        assertThatThrownBy(() -> request.regions().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> response.regions().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> result.regions().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> LanguagePair.all().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> SupportedLanguages.CODES.clear()).isInstanceOf(UnsupportedOperationException.class);
        for (Object value : List.of(request, request.regions().getFirst(), response, response.regions().getFirst(),
            result, result.regions().getFirst(), localValidator, PAIR)) {
            assertThat(value.toString()).doesNotContain("source-secret", "target-secret", JOB.toString(), id(1).toString());
        }
        for (var failure : TranslationValidationException.Failure.values()) {
            var error = new TranslationValidationException(failure);
            assertThat(error.getMessage()).isEqualTo(failure.name());
            assertThat(error.getCause()).isNull();
            error.addSuppressed(new RuntimeException("sensitive"));
            assertThat(error.getSuppressed()).isEmpty();
            assertThatThrownBy(() -> error.initCause(new RuntimeException("sensitive"))).isInstanceOf(IllegalStateException.class);
        }
    }

    private static void fails(Runnable action, TranslationValidationException.Failure failure) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(TranslationValidationException.class, error -> {
            assertThat(error.failure()).isEqualTo(failure);
            assertThat(error.getMessage()).isEqualTo(failure.name());
            assertThat(error.getCause()).isNull();
        });
    }
    private static UUID id(int i) { return new UUID(0, i); }
    private static TranslationRequest.Region region(int id, int order, String text) {
        return new TranslationRequest.Region(id(id), order, text);
    }
    private static TranslationResponse.Region translation(int id, String text) {
        return new TranslationResponse.Region(id(id), text);
    }
    private static TranslationRequest request(List<TranslationRequest.Region> regions) {
        return new TranslationRequest(JOB, PAIR, regions);
    }
    private static TranslationRequest single() { return request(List.of(region(1, 0, "a"))); }
    private static TranslationResponse response(TranslationResponse.Region... regions) {
        return new TranslationResponse(Arrays.asList(regions));
    }
    private static List<TranslationRequest.Region> sources(int count, String text) {
        return IntStream.range(0, count).mapToObj(i -> region(i + 1, i, text)).toList();
    }
    private static TranslationResponse translations(int count, String text) {
        return new TranslationResponse(IntStream.range(0, count).mapToObj(i -> translation(i + 1, text)).toList());
    }
}
