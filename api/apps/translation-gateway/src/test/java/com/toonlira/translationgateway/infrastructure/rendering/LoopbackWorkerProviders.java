package com.toonlira.translationgateway.infrastructure.rendering;

import com.google.cloud.translate.v3.TranslateTextResponse;
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
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.infrastructure.ocr.FakeVisionServer;
import com.toonlira.translationgateway.infrastructure.ocr.VisionOcrAdapter;
import com.toonlira.translationgateway.infrastructure.translation.CloudTranslationAdapter;
import com.toonlira.translationgateway.infrastructure.translation.FakeTranslationServer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Test-only official SDKs on loopback. Artificial responses are not quality evidence. */
final class LoopbackWorkerProviders implements AutoCloseable {
    private static final Duration DEADLINE = Duration.ofSeconds(60);
    private static final Pattern REGION = Pattern.compile("(<p data-region=\"[0-9a-f-]{36}\">)[^<>]*(</p>)");
    private final FakeVisionServer visionServer;
    private final FakeTranslationServer translationServer;
    private final VisionOcrAdapter vision;
    private final CloudTranslationAdapter translation;
    private volatile BatchAnnotateImagesResponse response;
    private volatile String outputText;

    LoopbackWorkerProviders() throws Exception {
        visionServer = new FakeVisionServer();
        try {
            translationServer = new FakeTranslationServer();
            try {
                vision = new VisionOcrAdapter(visionServer.client(DEADLINE), "test-project", "private-fixtures");
                try {
                    translation = new CloudTranslationAdapter(translationServer.client(DEADLINE), "test-project");
                } catch (Throwable error) { vision.close(); throw error; }
            } catch (Throwable error) { translationServer.close(); throw error; }
        } catch (Throwable error) { visionServer.close(); throw error; }
        visionServer.handler = (request, observer) -> {
            observer.onNext(response);
            observer.onCompleted();
        };
        translationServer.handler = (request, observer) -> {
            var matcher = REGION.matcher(request.getContents(0));
            var html = new StringBuilder();
            while (matcher.find()) matcher.appendReplacement(html, Matcher.quoteReplacement(
                matcher.group(1) + outputText + matcher.group(2)));
            matcher.appendTail(html);
            var result = TranslateTextResponse.newBuilder();
            result.addTranslationsBuilder().setModel(request.getModel()).setTranslatedText(html.toString());
            observer.onNext(result.build());
            observer.onCompleted();
        };
    }

    List<OcrManifest.Region> recognize(OcrPort.Command command, int count, int inputChars) {
        var page = Page.newBuilder().setWidth(command.widthPx()).setHeight(command.heightPx());
        var block = Block.newBuilder();
        int columns = (int) Math.ceil(Math.sqrt(count));
        for (int index = 0; index < count; index++) {
            int left = (index % columns) * command.widthPx() / columns;
            int top = (index / columns) * command.heightPx() / columns;
            int right = (int) (((double) (index % columns) + .9) * command.widthPx() / columns);
            int bottom = (int) (((double) (index / columns) + .9) * command.heightPx() / columns);
            var polygon = BoundingPoly.newBuilder()
                .addVertices(Vertex.newBuilder().setX(left).setY(top))
                .addVertices(Vertex.newBuilder().setX(right).setY(top))
                .addVertices(Vertex.newBuilder().setX(right).setY(bottom))
                .addVertices(Vertex.newBuilder().setX(left).setY(bottom));
            block.addParagraphs(Paragraph.newBuilder().setBoundingBox(polygon)
                .addWords(Word.newBuilder().addSymbols(Symbol.newBuilder().setText("a".repeat(inputChars)))));
        }
        if (count != 0) page.addBlocks(block);
        response = BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder()
            .setFullTextAnnotation(TextAnnotation.newBuilder().addPages(page))).build();
        return vision.recognize(command);
    }

    TranslationResponse translate(TranslationRequest request, String text) {
        outputText = text;
        return translation.translate(request);
    }

    static UUID regionId(UUID jobRef, int index) {
        return UUID.nameUUIDFromBytes((jobRef + ":vision:0:0:" + index).getBytes(StandardCharsets.UTF_8));
    }

    int visionCalls() { return visionServer.calls.get(); }
    int translationCalls() { return translationServer.calls.get(); }

    @Override public void close() throws Exception {
        try { vision.close(); }
        finally {
            try { translation.close(); }
            finally { try { visionServer.close(); } finally { translationServer.close(); } }
        }
    }

    @Override public String toString() { return "LoopbackWorkerProviders[synthetic]"; }
}
