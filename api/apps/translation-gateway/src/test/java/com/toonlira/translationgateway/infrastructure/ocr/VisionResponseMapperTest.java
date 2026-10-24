package com.toonlira.translationgateway.infrastructure.ocr;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Block;
import com.google.cloud.vision.v1.BoundingPoly;
import com.google.cloud.vision.v1.Page;
import com.google.cloud.vision.v1.Paragraph;
import com.google.cloud.vision.v1.Symbol;
import com.google.cloud.vision.v1.TextAnnotation;
import com.google.cloud.vision.v1.TextAnnotation.DetectedBreak;
import com.google.cloud.vision.v1.TextAnnotation.DetectedBreak.BreakType;
import com.google.cloud.vision.v1.TextAnnotation.TextProperty;
import com.google.cloud.vision.v1.Vertex;
import com.google.cloud.vision.v1.Word;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.util.UUID;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class VisionResponseMapperTest {
    static final OcrPort.Command COMMAND = new OcrPort.Command("private/originals/fixture", "ja",
        UUID.fromString("53c5d868-5988-48a8-b139-c83888df321b"), 100, 200);

    @ParameterizedTest
    @CsvSource({"ja,ja", "en,en", "es,es", "ko,ko", "zh-Hans,zh-Hans", "zh-Hant,zh-Hant", "pt-BR,pt"})
    void mapsOnlyExplicitHints(String language, String hint) {
        assertThat(VisionOcrAdapter.languageHint(language)).isEqualTo(hint);
    }

    @Test
    void rejectsUnknownLanguage() {
        assertThatThrownBy(() -> VisionOcrAdapter.languageHint("auto")).isInstanceOf(GatewayException.class);
    }

    @Test
    void preservesProviderOrderAndStableIdsForHorizontalAndVerticalCjk() {
        var response = response(paragraph("日本語", box(70, 10, 90, 180)), paragraph("Hello", box(0, 0, 60, 20)));
        var mapper = new VisionResponseMapper();
        var regions = mapper.map(response, COMMAND);
        assertThat(regions).hasSize(2).isEqualTo(mapper.map(response, COMMAND));
        assertThat(regions.getFirst().sourceText()).isEqualTo("日本語");
        assertThat(regions.getFirst().readingOrder()).isZero();
        assertThat(regions.getFirst().polygon().getFirst().x()).isEqualTo(0.7);
        assertThat(regions.getFirst().polygon().getFirst().y()).isEqualTo(0.05);
    }

    @Test
    void filtersIsolatedInvalidAndDuplicateParagraphsAndReindexes() {
        var valid = paragraph("same", box(0, 0, 10, 10));
        var regions = new VisionResponseMapper().map(response(paragraph("bad", box(-1, 0, 10, 10)), valid, valid), COMMAND);
        assertThat(regions).hasSize(1);
        assertThat(regions.getFirst().readingOrder()).isZero();
    }

    @Test
    void acceptsEmptyPageButRejectsTextWithoutUsableRegions() {
        assertThat(new VisionResponseMapper().map(response(), COMMAND)).isEmpty();
        assertInvalid(response(paragraph("text", BoundingPoly.getDefaultInstance())));
        var textOnly = AnnotateImageResponse.newBuilder().setFullTextAnnotation(TextAnnotation.newBuilder().setText("orphan"));
        assertInvalid(BatchAnnotateImagesResponse.newBuilder().addResponses(textOnly).build());
    }

    @Test
    void preservesDeclaredBreaksPrefixesAndNoHeuristicCjkSpacing() {
        var word = Word.newBuilder().addSymbols(symbol("日", BreakType.UNKNOWN, false))
            .addSymbols(symbol("本", BreakType.SPACE, false))
            .addSymbols(symbol("a", BreakType.SURE_SPACE, true))
            .addSymbols(symbol("b", BreakType.EOL_SURE_SPACE, false))
            .addSymbols(symbol("c", BreakType.HYPHEN, false))
            .addSymbols(symbol("d", BreakType.LINE_BREAK, false));
        var paragraph = Paragraph.newBuilder().setBoundingBox(box(0, 0, 90, 90)).addWords(word)
            .addWords(Word.newBuilder().addSymbols(Symbol.newBuilder().setText("文")))
            .addWords(Word.newBuilder().addSymbols(Symbol.newBuilder().setText("字"))).build();
        var mapped = new VisionResponseMapper().map(response(paragraph), COMMAND);
        assertThat(mapped.getFirst().sourceText()).isEqualTo("日本  ab\nc-\nd\n文字");
    }

    @Test
    void rejectsNonConvexGeometryAndRawResponseOrAggregateOverflow() {
        var crossing = BoundingPoly.newBuilder().addVertices(Vertex.newBuilder().setX(0).setY(0))
            .addVertices(Vertex.newBuilder().setX(10).setY(10)).addVertices(Vertex.newBuilder().setX(0).setY(10))
            .addVertices(Vertex.newBuilder().setX(10).setY(0)).build();
        assertInvalid(response(paragraph("bad", crossing)));
        var many = new Paragraph[65];
        Arrays.fill(many, paragraph("x".repeat(4096), box(0, 0, 10, 10)));
        assertInvalid(response(many));
        assertInvalid(BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder()
            .setFullTextAnnotation(TextAnnotation.newBuilder().setText("x".repeat(4 * 1048576 + 1)))).build());
        assertInvalid(BatchAnnotateImagesResponse.getDefaultInstance());
    }

    private Symbol symbol(String text, BreakType type, boolean prefix) {
        return Symbol.newBuilder().setText(text).setProperty(TextProperty.newBuilder()
            .setDetectedBreak(DetectedBreak.newBuilder().setType(type).setIsPrefix(prefix))).build();
    }

    @Test
    void rejectsInconsistentPagesAndAllLimitsWithoutTruncation() {
        var annotation = TextAnnotation.newBuilder().addPages(Page.newBuilder().setWidth(99).setHeight(200));
        assertInvalid(BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder().setFullTextAnnotation(annotation)).build());
        annotation.clearPages().addPages(Page.newBuilder().setWidth(100).setHeight(200)).addPages(Page.getDefaultInstance());
        assertInvalid(BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder().setFullTextAnnotation(annotation)).build());
        assertInvalid(response(paragraph("x".repeat(4097), box(0, 0, 10, 10))));
        var paragraphs = new Paragraph[1025];
        Arrays.fill(paragraphs, paragraph("x", box(0, 0, 10, 10)));
        assertInvalid(response(paragraphs));
    }

    static BatchAnnotateImagesResponse response(Paragraph... paragraphs) {
        var block = Block.newBuilder();
        for (var paragraph : paragraphs) block.addParagraphs(paragraph);
        return BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder()
            .setFullTextAnnotation(TextAnnotation.newBuilder().addPages(Page.newBuilder()
                .setWidth(100).setHeight(200).addBlocks(block)))).build();
    }

    static Paragraph paragraph(String text, BoundingPoly box) {
        var word = Word.newBuilder();
        text.codePoints().forEach(point -> word.addSymbols(Symbol.newBuilder().setText(new String(Character.toChars(point)))));
        return Paragraph.newBuilder().setBoundingBox(box).addWords(word).build();
    }

    static BoundingPoly box(int left, int top, int right, int bottom) {
        return BoundingPoly.newBuilder().addVertices(Vertex.newBuilder().setX(left).setY(top))
            .addVertices(Vertex.newBuilder().setX(right).setY(top)).addVertices(Vertex.newBuilder().setX(right).setY(bottom))
            .addVertices(Vertex.newBuilder().setX(left).setY(bottom)).build();
    }

    private void assertInvalid(BatchAnnotateImagesResponse response) {
        assertThatThrownBy(() -> new VisionResponseMapper().map(response, COMMAND)).isInstanceOf(GatewayException.class)
            .extracting("code").isEqualTo(GatewayErrorCode.OCR_INVALID_RESPONSE);
    }
}
