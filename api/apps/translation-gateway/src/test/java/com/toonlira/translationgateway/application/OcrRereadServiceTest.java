package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.LexiconPort;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.application.port.RereadImagingPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrParagraph;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.layout.TextBox;
import com.toonlira.translationgateway.domain.ocr.Lexicon;
import com.toonlira.translationgateway.domain.ocr.MosaicLayout;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class OcrRereadServiceTest {
    private static final int W = 1000, H = 1000;
    private final AtomicInteger calls = new AtomicInteger();

    @Test
    void doubtfulParagraphIsReplacedByTheVoteAndSureOnesAreNeverSent() {
        var confused = paragraph("WINDOWS 15 50 PATHETIC!", .55, 100, 100, 300, 140);
        var sure = paragraph("OH, WHAT'S THE MATTER?", .98, 500, 100, 700, 140);
        // Variant readings of the single doubtful crop: tiles 0, 1, 2.
        var service = service(8, tile -> switch (tile) {
            case 0, 1 -> "WINDOWS IS SO PATHETIC!";
            default -> "WINDOWS 15 SO PATHETIC!";
        });
        var result = service.improve(List.of(confused, sure), Path.of("page.png"), "en", W, H);
        assertThat(result.get(0).region().sourceText()).isEqualTo("WINDOWS IS SO PATHETIC!");
        assertThat(result.get(0).region().id()).isEqualTo(confused.region().id());
        assertThat(result.get(0).region().polygon()).isEqualTo(confused.region().polygon());
        assertThat(result.get(1)).isSameAs(sure);
        assertThat(calls.get()).isEqualTo(1); // one mosaic, one extra OCR call
    }

    @Test
    void groupedSpeechIsReReadWholeUsingTheWordsInsideIt() {
        // Two provider paragraphs merged into one speech; the doubtful word sits in the second one.
        var first = paragraph("THE CHOSEN", .97, 100, 100, 300, 120);
        var second = paragraph("05...", .7, 100, 122, 160, 140);
        var speech = new OcrManifest.Region(first.region().id(), 0, "THE CHOSEN 05...", box(100, 100, 300, 140, W, H));
        var service = service(8, tile -> tile < 3 ? "THE CHOSEN OS..." : "THE CHOSEN 05...");
        var result = service.improveRegions(List.of(speech), List.of(first, second), Path.of("page.png"), "en", W, H);
        assertThat(result).extracting(OcrManifest.Region::sourceText).containsExactly("THE CHOSEN OS...");
        assertThat(result.getFirst().id()).isEqualTo(speech.id());
    }

    @Test
    void disabledNothingDoubtfulOrProviderFailureKeepTheOriginalReading() {
        var confused = paragraph("WINDOWS 15 50 PATHETIC!", .55, 100, 100, 300, 140);
        var sure = paragraph("OH, WHAT'S THE MATTER?", .98, 500, 100, 700, 140);
        assertThat(service(0, tile -> "X").improve(List.of(confused), Path.of("p"), "en", W, H)).containsExactly(confused);
        assertThat(service(8, tile -> "X").improve(List.of(sure), Path.of("p"), "en", W, H)).containsExactly(sure);
        assertThat(service(8, tile -> { throw new IllegalStateException("provider down"); })
            .improve(List.of(confused), Path.of("p"), "en", W, H)).containsExactly(confused);
        assertThat(calls.get()).isEqualTo(1); // only the failing call reached the provider
    }

    @Test
    void textBoxesTheProviderLeftUnreadAreRecoveredAsNewParagraphs() {
        var read = List.of(paragraph("HELLO THERE", .98, 100, 100, 300, 140));
        var unread = new TextBox("t1", TextBox.Kind.text_free, new LayoutBox(.5, .5, .6, .54), .9);
        var alreadyRead = new TextBox("t2", TextBox.Kind.text_bubble, new LayoutBox(.12, .105, .2, .135), .95);
        var service = service(8, tile -> "第1話");
        var job = UUID.randomUUID();
        var result = service.recover(read, List.of(unread, alreadyRead), Path.of("page.png"), "ja", job, W, H);
        assertThat(result).hasSize(2);
        assertThat(result.getFirst()).isSameAs(read.getFirst());
        var recovered = result.get(1).region();
        assertThat(recovered.sourceText()).isEqualTo("第1話");
        assertThat(recovered.readingOrder()).isEqualTo(1);
        assertThat(recovered.polygon()).isEqualTo(box(500, 500, 600, 540, W, H));
        assertThat(recovered.id()).isEqualTo(UUID.nameUUIDFromBytes((job + ":recovered:t1").getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        assertThat(calls.get()).isEqualTo(1); // only the unread box was sent, in one mosaic
    }

    @Test
    void readingAcrossVerticalColumnsOrNothingToRecoverAddsNothing() {
        var read = List.of(paragraph("HELLO THERE", .98, 100, 100, 300, 140));
        var vertical = new TextBox("t1", TextBox.Kind.text_bubble, new LayoutBox(.7, .1, .74, .3), .9);
        // The provider laid "であ" out horizontally inside a tall box: characters of two columns, discarded.
        assertThat(service(8, tile -> "であも").recover(read, List.of(vertical), Path.of("p"), "ja", UUID.randomUUID(), W, H))
            .isEqualTo(read);
        assertThat(service(8, tile -> "X").recover(read, List.of(), Path.of("p"), "ja", UUID.randomUUID(), W, H)).isSameAs(read);
        assertThat(service(0, tile -> "X").recover(read, List.of(vertical), Path.of("p"), "ja", UUID.randomUUID(), W, H)).isSameAs(read);
        assertThat(calls.get()).isEqualTo(1);
    }

    @Test
    void mosaicWordsKeepProviderBreaksAndNeighbourLinesAreDropped() {
        var crop = new int[]{94, 94, 306, 146}; // paragraph box 100..300 x 100..140 plus the 6 px margin
        var box = new int[]{100, 100, 300, 140};
        var layout = MosaicLayout.pack(List.of(new int[]{424, 104})); // crop at 2x
        var tile = layout.tiles().getFirst();
        // Words at page y=120 (inside) are kept; a word at page y=145 (next line, inside the margin) is dropped.
        var words = List.of(word("SAYING", tile, 110, 120, layout), word(",", tile, 170, 120, layout),
            word(" ", tile, 175, 120, layout), word("WHY", tile, 190, 120, layout), word("akane", tile, 120, 145, layout));
        var read = List.of(new OcrParagraph(new OcrManifest.Region(UUID.randomUUID(), 0, "x", words.getFirst().polygon()), words));
        var readings = OcrRereadService.readingsPerTile(read, MosaicLayout.pack(List.of(new int[]{424, 104}, new int[]{0, 0}, new int[]{0, 0})),
            List.of(crop), List.of(box));
        assertThat(readings.getFirst().text()).isEqualTo("SAYING, WHY");
    }

    private static OcrParagraph.Word word(String text, MosaicLayout.Tile tile, double pageX, double pageY, MosaicLayout.Layout layout) {
        double x = tile.x() + (pageX - 94) * 2, y = tile.y() + (pageY - 94) * 2;
        var w = (double) layout.width(); var h = (double) layout.height();
        return new OcrParagraph.Word(text, List.of(new OcrManifest.Vertex((x - 2) / w, (y - 2) / h), new OcrManifest.Vertex((x + 2) / w, (y - 2) / h),
            new OcrManifest.Vertex((x + 2) / w, (y + 2) / h), new OcrManifest.Vertex((x - 2) / w, (y + 2) / h)), .9);
    }

    private OcrRereadService service(int max, java.util.function.IntFunction<String> readingOfTile) {
        var properties = new GatewayProperties();
        properties.getOcr().setRereadMaxRegions(max);
        RereadImagingPort imaging = (image, crops) -> {
            var sizes = new ArrayList<int[]>();
            for (int i = 0; i < crops.size() * RereadImagingPort.VARIANTS; i++) sizes.add(new int[]{400, 80});
            return new RereadImagingPort.Mosaic(new byte[]{1}, MosaicLayout.pack(sizes));
        };
        OcrPort ocr = new OcrPort() {
            public boolean available() { return true; }
            public List<OcrManifest.Region> recognize(Command command) { throw new UnsupportedOperationException(); }
            public List<OcrParagraph> recognizeImage(byte[] png, String language, int width, int height) {
                calls.incrementAndGet();
                var layout = imaging.build(null, List.of(new int[4]));
                var read = new ArrayList<OcrParagraph>();
                for (int tile = 0; tile < layout.layout().tiles().size(); tile++) {
                    var t = layout.layout().tiles().get(tile);
                    var box = box(t.x() + 5, t.y() + 5, t.x() + t.width() - 5, t.y() + t.height() - 5, width, height);
                    var text = readingOfTile.apply(tile);
                    read.add(new OcrParagraph(new OcrManifest.Region(UUID.randomUUID(), tile, text, box),
                        List.of(new OcrParagraph.Word(text, box, .95))));
                }
                return read;
            }
        };
        LexiconPort lexicons = language -> new Lexicon(Set.of("windows", "is", "so", "pathetic", "oh", "what's", "the", "matter",
            "chosen", "os"));
        return new OcrRereadService(ocr, imaging, lexicons, properties);
    }

    private static OcrParagraph paragraph(String text, double confidence, int l, int t, int r, int b) {
        var box = box(l, t, r, b, W, H);
        var words = new ArrayList<OcrParagraph.Word>();
        var tokens = text.split(" ");
        for (int i = 0; i < tokens.length; i++)
            words.add(new OcrParagraph.Word(tokens[i] + (i < tokens.length - 1 ? " " : ""), box, confidence));
        return new OcrParagraph(new OcrManifest.Region(UUID.randomUUID(), 0, text, box), words);
    }

    private static List<OcrManifest.Vertex> box(double l, double t, double r, double b, double w, double h) {
        return List.of(new OcrManifest.Vertex(l / w, t / h), new OcrManifest.Vertex(r / w, t / h),
            new OcrManifest.Vertex(r / w, b / h), new OcrManifest.Vertex(l / w, b / h));
    }
}
