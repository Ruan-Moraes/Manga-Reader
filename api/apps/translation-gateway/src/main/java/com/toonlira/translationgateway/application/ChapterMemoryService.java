package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.ChapterMemoryRepository;
import com.toonlira.translationgateway.application.port.LexiconPort;
import com.toonlira.translationgateway.application.port.TranslationJobRepository;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.domain.translation.ChapterTerms;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Chapter memory of one page's translation: the names the page shares with its chapter ({@link ChapterTerms}) come
 * out as the chapter first translated them. A name not decided yet is translated alone, once, and stored for the next
 * pages; another page deciding it at the same time wins if it stored first. Memory can only make a page consistent,
 * never fail it: any error gives the page no decided terms, as if it had no chapter.
 */
public final class ChapterMemoryService {
    private static final Logger LOG = LoggerFactory.getLogger(ChapterMemoryService.class);
    /** At most this many new names are translated for one page (one small provider call). */
    static final int MAX_NEW_TERMS = 32;
    private final ChapterMemoryRepository memory;
    private final LexiconPort lexicons;
    private final TranslationPort translation;
    private final Clock clock;
    private final Duration retention;

    /** {@code retention}: the disclosed result retention, which terms (page content) never outlive. */
    public ChapterMemoryService(ChapterMemoryRepository memory, LexiconPort lexicons, TranslationPort translation,
                                Clock clock, Duration retention) {
        this.memory = memory;
        this.lexicons = lexicons;
        this.translation = translation;
        this.clock = clock;
        this.retention = retention;
    }

    /**
     * Stores the proper names a review used on a page (any script, see TranslationRefinerPort.Review); names another
     * page decided first keep their translation. Never fails the page.
     */
    public void learn(TranslationJobRepository.WorkItem job, com.toonlira.translationgateway.domain.translation.LanguagePair pair,
                      Map<String, String> names) {
        if (memory == null || job.contextRef() == null || job.installationId() == null || names.isEmpty()) return;
        try {
            var now = clock.instant();
            var kept = new HashMap<String, String>();
            names.forEach((source, target) -> {
                if (source != null && target != null && !source.isBlank() && !target.isBlank()
                    && source.strip().length() <= ChapterTerms.MAX_TERM_LENGTH && target.strip().length() <= 2 * ChapterTerms.MAX_TERM_LENGTH
                    && source.lines().count() == 1 && target.lines().count() == 1) kept.put(source.strip(), target.strip());
            });
            memory.remember(job.installationId(), job.contextRef(), pair, kept, kept.keySet(), now, now.plus(retention));
        } catch (RuntimeException error) {
            LOG.warn("chapter memory not updated: {}", FailureDiagnostics.describe(error));
        }
    }

    /** Decided terms (source -> translation) the page must keep; empty without a chapter. */
    public Map<String, String> decide(TranslationJobRepository.WorkItem job, TranslationRequest request) {
        if (memory == null || job.contextRef() == null || job.installationId() == null || request.regions().isEmpty())
            return Map.of();
        try {
            var now = clock.instant();
            var texts = request.regions().stream().map(TranslationRequest.Region::sourceText).toList();
            var lexicon = lexicons == null ? com.toonlira.translationgateway.domain.ocr.Lexicon.NONE
                : lexicons.forLanguage(request.pair().source());
            // A word this page writes in lower case is no name: a capitalised decision for it was emphasis or a title.
            memory.forget(job.installationId(), job.contextRef(), request.pair(), ChapterTerms.ordinaryWords(texts));
            var names = ChapterTerms.candidates(texts, request.pair().source(), lexicon);
            if (names.isEmpty()) return memory.find(job.installationId(), job.contextRef(), request.pair(), now);
            var known = memory.find(job.installationId(), job.contextRef(), request.pair(), now);
            var fresh = new ArrayList<String>();
            for (var name : names) if (!known.containsKey(name) && fresh.size() < MAX_NEW_TERMS) fresh.add(name);
            var decided = new HashMap<String, String>();
            if (!fresh.isEmpty()) {
                var regions = new ArrayList<TranslationRequest.Region>();
                var ids = new ArrayList<UUID>();
                for (int i = 0; i < fresh.size(); i++) {
                    var id = UUID.randomUUID();
                    ids.add(id);
                    regions.add(new TranslationRequest.Region(id, i, fresh.get(i)));
                }
                var translated = translation.translate(new TranslationRequest(request.jobRef(), request.pair(), regions));
                var byId = new HashMap<UUID, String>();
                for (var region : translated.regions()) byId.put(region.id(), region.translatedText().strip());
                for (int i = 0; i < fresh.size(); i++) {
                    var target = byId.get(ids.get(i));
                    if (target != null && !target.isBlank() && target.length() <= 2 * ChapterTerms.MAX_TERM_LENGTH
                        && target.lines().count() == 1) decided.put(fresh.get(i), target);
                }
            }
            memory.remember(job.installationId(), job.contextRef(), request.pair(), decided, names, now, now.plus(retention));
            return memory.find(job.installationId(), job.contextRef(), request.pair(), now);
        } catch (RuntimeException error) {
            LOG.warn("chapter memory skipped: {}", FailureDiagnostics.describe(error));
            return Map.of();
        }
    }
}
