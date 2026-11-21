package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ChapterMemoryRepository;
import com.toonlira.translationgateway.application.port.InlineOcrPort;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.application.port.LexiconPort;
import com.toonlira.translationgateway.application.port.PageDecoderPort;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.application.port.TranslationRefinerPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrParagraph;
import com.toonlira.translationgateway.domain.OcrRegionGrouper;
import com.toonlira.translationgateway.domain.layout.Bubble;
import com.toonlira.translationgateway.domain.layout.BubbleDeduplicator;
import com.toonlira.translationgateway.domain.layout.Detections;
import com.toonlira.translationgateway.domain.layout.LayoutFailure;
import com.toonlira.translationgateway.domain.layout.LayoutParameters;
import com.toonlira.translationgateway.domain.ocr.Lexicon;
import com.toonlira.translationgateway.domain.ocr.OcrAssembly;
import com.toonlira.translationgateway.domain.rendering.CaptionFilter;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.translation.ChapterTerm;
import com.toonlira.translationgateway.domain.translation.ChapterTerms;
import com.toonlira.translationgateway.domain.translation.FragmentJoiner;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationLimits;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import java.awt.image.BufferedImage;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

/**
 * The page stages of the volatile pipeline, all in memory: reading (OCR with balloon grouping, recovery and re-reading
 * of doubtful speech), layout hints, translation with the chapter memory and the optional language review, and the
 * render hints. Each analysis step is best effort: a detector, re-read or review failure keeps the plainer result and
 * never fails the page.
 */
@Service
public class VolatilePagePipeline {
    private static final Logger LOG = LoggerFactory.getLogger(VolatilePagePipeline.class);
    private final GatewayProperties properties;
    private final ObjectProvider<LayoutPort> layouts;
    private final ObjectProvider<OcrRereadService> rereads;
    private final ObjectProvider<LexiconPort> lexicons;
    private final ObjectProvider<PageDecoderPort> decoders;
    private final ObjectProvider<TranslationRefinerPort> refiners;
    private final ObjectProvider<ChapterMemoryRepository> memories;
    private final ObjectMapper mapper;
    private final Clock clock;

    public VolatilePagePipeline(GatewayProperties properties, ObjectProvider<LayoutPort> layouts,
                                ObjectProvider<OcrRereadService> rereads, ObjectProvider<LexiconPort> lexicons,
                                ObjectProvider<PageDecoderPort> decoders, ObjectProvider<TranslationRefinerPort> refiners,
                                ObjectProvider<ChapterMemoryRepository> memories, ObjectMapper mapper, Clock clock) {
        this.properties = properties; this.layouts = layouts; this.rereads = rereads; this.lexicons = lexicons;
        this.decoders = decoders; this.refiners = refiners; this.memories = memories; this.mapper = mapper; this.clock = clock;
    }

    /** No detector, re-read, lexicon, review or chapter memory: the page is read, grouped and translated plainly. */
    public static VolatilePagePipeline plain(GatewayProperties properties) {
        var none = new org.springframework.beans.factory.support.StaticListableBeanFactory();
        return new VolatilePagePipeline(properties, none.getBeanProvider(LayoutPort.class), none.getBeanProvider(OcrRereadService.class),
            none.getBeanProvider(LexiconPort.class), none.getBeanProvider(PageDecoderPort.class),
            none.getBeanProvider(TranslationRefinerPort.class), none.getBeanProvider(ChapterMemoryRepository.class),
            new ObjectMapper(), Clock.systemUTC());
    }

    /** The page's regions and the balloon detections that grouped them (null when none ran), reused by the layout. */
    public record Reading(List<OcrManifest.Region> regions, Detections detections) { }

    /** The page's translation and the chapter names it used, which the result hands back to the client. */
    public record PageTranslation(TranslationResponse response, List<ChapterTerm> terms) { }

    /** Decodes the page once for every analysis step; null (WebP, unreadable) skips them. */
    public BufferedImage decode(byte[] original) {
        try { return decoders.getIfAvailable(() -> PageDecoderPort.NONE).decode(original); }
        catch (RuntimeException | LinkageError unreadable) { return null; }
    }

    /**
     * OCR as the stored pipeline did it (and as the offline corpus replay checks it): balloons decide which words form
     * one speech, text the provider skipped is read again where the detector saw lettering, doubtful speeches are
     * re-read whole, then the assembly repairs lettering misreadings.
     */
    public Reading read(InlineOcrPort ocr, byte[] original, BufferedImage page, RenderSource source,
                                        String sourceLanguage, UUID operation) {
        int width = source.widthPx(), height = source.heightPx();
        var detections = page == null ? null : detectForGrouping(page);
        var bubbles = detections == null ? null : detections.bubbles().stream().map(Bubble::bounds).toList();
        var reread = page == null ? null : rereads.getIfAvailable();
        boolean rereading = reread != null && reread.enabled();
        List<OcrManifest.Region> regions;
        List<OcrParagraph> read = List.of();
        if (bubbles == null && !rereading) {
            regions = OcrRegionGrouper.group(ocr.recognize(original, sourceLanguage, operation, width, height),
                sourceLanguage, width, height, null);
        } else {
            read = ocr.recognizeParagraphs(original, sourceLanguage, operation, width, height);
            // Text the provider skipped entirely (short balloons like 「わーい」) is read again where the detector saw
            // lettering; recovered boxes join the page as ordinary paragraphs before grouping.
            if (rereading && detections != null)
                read = reread.recover(read, detections.texts(), page, sourceLanguage, operation, width, height);
            read = OcrParagraph.withoutGuesses(read);
            regions = OcrAssembly.fitTextBoxes(OcrAssembly.group(read, bubbles, sourceLanguage, width, height),
                detections == null ? List.of() : detections.texts());
        }
        // Doubtful speeches are re-read whole, after grouping: context is what lets the provider read "THIS OS" where a
        // lone "05..." fragment stays ambiguous.
        if (rereading) regions = reread.improveRegions(regions, read, page, sourceLanguage, width, height);
        return new Reading(OcrAssembly.finish(regions, sourceLanguage, lexicon(sourceLanguage)), detections);
    }

    /** What the layout says about this page's regions; none when the page was not decoded or the detector failed. */
    public LayoutHints layout(BufferedImage page, OcrManifest ocr, String imageSha256, String ocrSha256, Detections detections) {
        var layout = layouts.getIfAvailable();
        if (page == null || layout == null || !layout.available()) return LayoutHints.NONE;
        try {
            var result = layout.analyze(page, ocr, imageSha256, ocrSha256, detections);
            if (result == null || !imageSha256.equals(result.imageSha256()) || !ocrSha256.equals(result.ocrManifestSha256())
                || result.associations().size() != ocr.regions().size()) throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
            BubbleDeduplicator.validateAudit(result);
            var bytes = mapper.writeValueAsBytes(result);
            if (bytes.length > LayoutParameters.MAX_BYTES) throw new LayoutFailure(LayoutFailure.Code.LIMIT_EXCEEDED);
            return LayoutHints.of(bytes, imageSha256, ocrSha256);
        } catch (RuntimeException | LinkageError error) {
            LOG.warn("layout skipped: {}", FailureDiagnostics.describe(error));
            return LayoutHints.NONE;
        }
    }

    /** The translation request with the detector's class of each region, when the layout knows it. */
    public static TranslationRequest request(UUID operation, LanguagePair pair, List<OcrManifest.Region> regions, LayoutHints hints) {
        return new TranslationRequest(operation, pair, regions.stream().map(region -> new TranslationRequest.Region(
            region.id(), region.readingOrder(), region.sourceText(), hints.kinds().get(region.id()))).toList());
    }

    /**
     * Machine translation keeping the terms the chapter already decided, then the optional language review, which
     * keeps them too and reports the page's names for the chapter's next pages. Without a chapter: as always. A word
     * split one character per balloon is translated, and reviewed, as one segment.
     */
    public PageTranslation translate(TranslationPort translation, ChapterMemoryService.Chapter chapter, TranslationRequest request) {
        if (request.regions().isEmpty()) return new PageTranslation(new TranslationResponse(List.of()), List.of());
        var fragments = FragmentJoiner.of(request);
        var page = translateJoined(translation, chapter, fragments.request());
        return new PageTranslation(fragments.expand(page.response()), page.terms());
    }

    private PageTranslation translateJoined(TranslationPort translation, ChapterMemoryService.Chapter chapter, TranslationRequest request) {
        var refiner = refiners.getIfAvailable(() -> TranslationRefinerPort.NONE);
        var chapters = new ChapterMemoryService(memories.getIfAvailable(), lexicons.getIfAvailable(), translation, clock,
            Duration.ofSeconds(properties.getDisclosure().getResultRetentionSeconds()));
        boolean inChapter = chapter != null && chapter.contextRef() != null;
        boolean reviewed = inChapter && refiner != TranslationRefinerPort.NONE;
        var decided = chapters.decide(chapter, request, !reviewed);
        boolean onPage = decided.keySet().stream().anyMatch(term -> request.regions().stream()
            .anyMatch(region -> region.sourceText().toUpperCase(Locale.ROOT).contains(term.toUpperCase(Locale.ROOT))));
        var machine = onPage ? translation.translate(request, decided) : translation.translate(request);
        // Only the chapter's names this page actually holds: the rest says nothing about it.
        var used = new TreeMap<String, String>();
        decided.forEach((source, target) -> {
            if (request.regions().stream().anyMatch(region -> !ChapterTerms.occurrences(region.sourceText(), Map.of(source, target)).isEmpty()))
                used.put(source, target);
        });
        if (!inChapter) return new PageTranslation(refineOrKeep(refiner, request, machine), List.of());
        if (refiner == TranslationRefinerPort.NONE) return new PageTranslation(machine, ChapterTerm.of(used, ChapterTerm.MAX_PER_PAGE));
        try {
            var review = refiner.refine(request, machine, decided);
            if (review != null && review.response() != null && sameRegions(machine, review.response())) {
                var names = chapters.reviewNames(request, review.names());
                chapters.learn(chapter, request.pair(), names);
                // A name the chapter decided first keeps that translation; the review's own names follow.
                names.forEach(used::putIfAbsent);
                return new PageTranslation(review.response(), ChapterTerm.of(used, ChapterTerm.MAX_PER_PAGE));
            }
            LOG.warn("translation refine discarded: regions={} reply did not match the page", request.regions().size());
        } catch (RuntimeException error) {
            LOG.warn("translation refine skipped: regions={} cause={}", request.regions().size(), error.getClass().getSimpleName());
        }
        return new PageTranslation(machine, ChapterTerm.of(used, ChapterTerm.MAX_PER_PAGE));
    }

    /**
     * What the renderer needs besides the text: the detected balloons and which regions read as speech, hand-drawn
     * sentences or drawn text to keep (sound effects, signs).
     */
    public RenderRequest renderHints(RenderRequest request, LayoutHints hints, String sourceLanguage) {
        var hinted = request.withBubbles(hints.bubbles());
        var lexicon = lexicons.getIfAvailable();
        if (lexicon == null) return hinted;
        var words = lexicon.forLanguage(sourceLanguage);
        return hinted.withCaptionHints(CaptionFilter.captions(hinted, words, hints.kinds()))
            .withLetteringHints(CaptionFilter.letterings(hinted, words, hints.kinds()))
            .withDrawnHints(CaptionFilter.drawn(hinted, words, hints.kinds()));
    }

    /**
     * Balloon boxes for OCR grouping, deduplicated like the layout. Null when grouping is not enabled or the detector
     * fails: the caller keeps the proximity heuristic.
     */
    private Detections detectForGrouping(BufferedImage page) {
        var layout = layouts.getIfAvailable();
        if (layout == null || !layout.available() || !layout.groups()) return null;
        try {
            var detected = layout.detect(page);
            if (detected == null) return null;
            return new Detections(BubbleDeduplicator.filter(detected.bubbles()).retained(), detected.texts());
        } catch (RuntimeException | LinkageError error) {
            // Grouping falls back to proximity; say so, or split balloons look like an OCR problem.
            LOG.warn("balloon detection failed, grouping by proximity: {}", FailureDiagnostics.describe(error));
            return null;
        }
    }

    private Lexicon lexicon(String sourceLanguage) {
        var lexicon = lexicons.getIfAvailable();
        return lexicon == null ? Lexicon.NONE : lexicon.forLanguage(sourceLanguage);
    }

    private static TranslationResponse refineOrKeep(TranslationRefinerPort refiner, TranslationRequest request, TranslationResponse translated) {
        if (refiner == TranslationRefinerPort.NONE) return translated;
        try {
            var refined = refiner.refine(request, translated);
            if (refined != null && sameRegions(translated, refined)) return refined;
            LOG.warn("translation refine discarded: regions={} reply did not match the page", request.regions().size());
        } catch (RuntimeException error) {
            LOG.warn("translation refine skipped: regions={} cause={}", request.regions().size(), error.getClass().getSimpleName());
        }
        return translated;
    }

    private static boolean sameRegions(TranslationResponse translated, TranslationResponse refined) {
        if (refined.regions().size() != translated.regions().size()) return false;
        for (int index = 0; index < translated.regions().size(); index++) {
            var region = refined.regions().get(index);
            if (!translated.regions().get(index).id().equals(region.id()) || region.translatedText() == null
                || region.translatedText().isBlank() || region.translatedText().length() > TranslationLimits.MAX_TRANSLATED_PER_REGION)
                return false;
        }
        return true;
    }
}
