package com.toonlira.translationgateway.evaluation;

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
import com.google.cloud.vision.v1.Vertex;
import com.google.cloud.vision.v1.Word;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.infrastructure.ocr.VisionResponseMapper;
import java.util.List;
import java.util.Arrays;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class VisionDiagnosticTest {
    private static final UUID JOB = UUID.fromString("1c07d44f-d580-43bb-a14c-49cc49947880");

    @Test
    void preservesScrambledMixedGeometrySymbolsBreaksAndMissingConfidence() throws Exception {
        var first = symbol("日", box(80, 50, 90, 60));
        var second = symbol("本", box(60, 10, 70, 20)).toBuilder().setConfidence(.8f)
            .setProperty(TextAnnotation.TextProperty.newBuilder().setDetectedBreak(
                TextAnnotation.DetectedBreak.newBuilder().setType(TextAnnotation.DetectedBreak.BreakType.LINE_BREAK))).build();
        var small = symbol("あ", box(92, 50, 95, 55));
        var vertical = paragraph(box(60, 10, 95, 100), first, second, small);
        var horizontal = paragraph(box(0, 110, 90, 125), symbol("English", BoundingPoly.getDefaultInstance()));
        var batch = batch(vertical, horizontal);
        var result = VisionDiagnostic.inspect(batch.toByteArray(), manifest(batch));
        var symbols = result.path("nodes").findParents("kind").stream()
            .filter(n -> n.path("kind").asText().equals("symbol")).toList();
        assertThat(symbols).hasSize(4);
        assertThat(symbols.getFirst().path("text").asText()).isEqualTo("日");
        assertThat(symbols.getFirst().path("confidence").isNull()).isTrue();
        assertThat(symbols.get(1).path("detectedBreak").path("type").asText()).isEqualTo("LINE_BREAK");
        assertThat(symbols.getLast().path("geometry").asText()).isEqualTo("missing");
        assertThat(result.path("mapperReplayExactlyMatches").asBoolean()).isTrue();
    }

    @Test
    void accountsForFilteredParagraphsWithoutConfusingLegitimateRepeatedText() throws Exception {
        var valid = paragraph(box(0, 0, 30, 30), symbol("same", box(0, 0, 30, 30)));
        var batch = batch(paragraph(box(0,0,1,1)), paragraph(box(-1,0,1,1), symbol("bad", box(-1,0,1,1))), valid, valid,
            paragraph(box(40, 0, 70, 30), symbol("same", box(40, 0, 70, 30))));
        var result = VisionDiagnostic.inspect(batch.toByteArray(), manifest(batch));
        var paragraphs = result.path("nodes").findParents("kind").stream().filter(n -> n.path("kind").asText().equals("paragraph")).toList();
        assertThat(paragraphs.stream().map(n -> n.path("disposition").asText()).toList())
            .containsExactly("blank", "invalid-geometry", "retained", "duplicate", "retained");
        assertThat(paragraphs.get(2).path("readingOrder").asInt()).isZero();
        assertThat(paragraphs.get(4).path("readingOrder").asInt()).isEqualTo(1);
    }

    @Test
    void rejectsTruncationOverflowAndManifestMismatch() {
        var batch = batch(paragraph(box(0,0,20,20), symbol("test", box(0,0,20,20))));
        var manifest = manifest(batch);
        assertThatThrownBy(() -> VisionDiagnostic.inspect(new byte[]{10, 127}, manifest)).isInstanceOf(Exception.class);
        assertThatThrownBy(() -> VisionDiagnostic.inspect(new byte[4_194_305], manifest)).isInstanceOf(Exception.class);
        var changed = new OcrManifest("1.0", JOB, "ja", 100, 200, List.of());
        assertThatThrownBy(() -> VisionDiagnostic.inspect(batch.toByteArray(), changed)).isInstanceOf(Exception.class);
    }

    @Test
    void inventoriesEmptyPageAndOrganizedVerticalWithoutInferringDirection() throws Exception {
        var empty = batch();
        assertThat(VisionDiagnostic.inspect(empty.toByteArray(), manifest(empty)).path("nodes").size()).isEqualTo(2);
        var batch = batch(paragraph(box(70,10,90,100), symbol("日", box(70,10,90,30)), symbol("本", box(70,40,90,60))));
        var result = VisionDiagnostic.inspect(batch.toByteArray(), manifest(batch));
        assertThat(result.path("nodes").get(2).path("aspectHint").asText()).isEqualTo("tall");
        assertThat(result.has("direction")).isFalse();
    }

    @Test
    void rejectsDiagnosticExpansionWithoutTruncating() {
        var symbols = new Symbol[4096];
        Arrays.fill(symbols, symbol("x", box(0,0,1,1)));
        var paragraphs = new Paragraph[20];
        for (int i = 0; i < paragraphs.length; i++) paragraphs[i] = paragraph(box(i,0,i+1,1), symbols);
        var batch = batch(paragraphs);
        assertThat(batch.getSerializedSize()).isLessThan(4_194_304);
        assertThatThrownBy(() -> VisionDiagnostic.inspect(batch.toByteArray(), manifest(batch)))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("diagnostic-invalid-artifact");
    }

    static OcrManifest manifest(BatchAnnotateImagesResponse batch) {
        return new OcrManifest("1.0", JOB, "ja", 100, 200, new VisionResponseMapper().map(batch, new OcrPort.Command("local", "ja", JOB, 100, 200)));
    }
    static BatchAnnotateImagesResponse batch(Paragraph... paragraphs) {
        return BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder().setFullTextAnnotation(
            TextAnnotation.newBuilder().addPages(Page.newBuilder().setWidth(100).setHeight(200).addBlocks(
                Block.newBuilder().addAllParagraphs(List.of(paragraphs)))))).build();
    }
    static Paragraph paragraph(BoundingPoly box, Symbol... symbols) {
        return Paragraph.newBuilder().setBoundingBox(box).addWords(Word.newBuilder().addAllSymbols(List.of(symbols))).build();
    }
    static Symbol symbol(String text, BoundingPoly box) { return Symbol.newBuilder().setText(text).setBoundingBox(box).build(); }
    static BoundingPoly box(int left, int top, int right, int bottom) {
        return BoundingPoly.newBuilder().addVertices(Vertex.newBuilder().setX(left).setY(top))
            .addVertices(Vertex.newBuilder().setX(right).setY(top)).addVertices(Vertex.newBuilder().setX(right).setY(bottom))
            .addVertices(Vertex.newBuilder().setX(left).setY(bottom)).build();
    }
}
