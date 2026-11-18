package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.application.port.ChapterMemoryRepository;
import com.toonlira.translationgateway.application.port.TranslationJobRepository;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ocr.Lexicon;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ChapterMemoryServiceTest {
    private static final Instant NOW = Instant.parse("2026-11-18T12:00:00Z");
    private static final LanguagePair PAIR = new LanguagePair("en", "pt-BR");
    private static final UUID INSTALLATION = UUID.randomUUID(), CHAPTER = UUID.randomUUID();
    private static final Lexicon EN = new Lexicon(Set.of("basil", "here", "is", "with", "the", "potion", "thanks"));

    /** Translates a lone term by a fixed table and counts the calls. */
    private static final class Terms implements TranslationPort {
        final List<List<String>> calls = new ArrayList<>();
        @Override public TranslationResponse translate(TranslationRequest request) {
            calls.add(request.regions().stream().map(TranslationRequest.Region::sourceText).toList());
            return new TranslationResponse(request.regions().stream().map(region ->
                new TranslationResponse.Region(region.id(), region.sourceText().equals("Basil") ? "Manjericão" : region.sourceText())).toList());
        }
    }

    /** First decision wins, like the table's primary key. */
    private static class Memory implements ChapterMemoryRepository {
        final Map<String, String> terms = new HashMap<>();
        Instant expires;
        @Override public Map<String, String> find(UUID installation, UUID context, LanguagePair pair, Instant now) { return Map.copyOf(terms); }
        @Override public void remember(UUID installation, UUID context, LanguagePair pair, Map<String, String> decided,
                                       Iterable<String> used, Instant now, Instant expiresAt) {
            decided.forEach(terms::putIfAbsent);
            expires = expiresAt;
        }
        @Override public int deleteExpired(Instant now, int limit) { return 0; }
    }

    private static TranslationJobRepository.WorkItem job(UUID context) {
        return new TranslationJobRepository.WorkItem(UUID.randomUUID(), UUID.randomUUID(), JobStatus.TRANSLATING, "en", "pt-BR",
            "k", "h", null, null, INSTALLATION, context);
    }

    private static TranslationRequest page(String... texts) {
        var regions = new ArrayList<TranslationRequest.Region>();
        for (int i = 0; i < texts.length; i++) regions.add(new TranslationRequest.Region(UUID.randomUUID(), i, texts[i]));
        return new TranslationRequest(UUID.randomUUID(), PAIR, regions);
    }

    private static ChapterMemoryService service(Memory memory, Terms terms) {
        return new ChapterMemoryService(memory, language -> EN, terms, Clock.fixed(NOW, ZoneOffset.UTC), Duration.ofHours(1));
    }

    @Test
    void aNameIsTranslatedAloneOnceAndEveryLaterPageOfTheChapterKeepsIt() {
        var memory = new Memory();
        var terms = new Terms();
        var service = service(memory, terms);
        assertThat(service.decide(job(CHAPTER), page("Here is Basil with the potion."))).isEqualTo(Map.of("Basil", "Manjericão"));
        assertThat(terms.calls).containsExactly(List.of("Basil"));
        assertThat(memory.expires).isEqualTo(NOW.plus(Duration.ofHours(1)));
        // Next page: decided already, no provider call; even where the page itself gives no signal (sentence start).
        assertThat(service.decide(job(CHAPTER), page("Basil is here."))).isEqualTo(Map.of("Basil", "Manjericão"));
        assertThat(terms.calls).hasSize(1);
    }

    @Test
    void aTermAnotherPageDecidedFirstKeepsItsTranslation() {
        var memory = new Memory();
        memory.terms.put("Basil", "Basil");
        assertThat(service(memory, new Terms()).decide(job(CHAPTER), page("Here is Basil."))).isEqualTo(Map.of("Basil", "Basil"));
    }

    @Test
    void withoutAChapterOrWhenMemoryFailsThePageIsTranslatedOnItsOwn() {
        var terms = new Terms();
        assertThat(service(new Memory(), terms).decide(job(null), page("Here is Basil."))).isEmpty();
        assertThat(terms.calls).isEmpty();
        var broken = new Memory() {
            @Override public Map<String, String> find(UUID installation, UUID context, LanguagePair pair, Instant now) {
                throw new IllegalStateException("database down");
            }
        };
        assertThat(service(broken, terms).decide(job(CHAPTER), page("Here is Basil."))).isEmpty();
    }
}
