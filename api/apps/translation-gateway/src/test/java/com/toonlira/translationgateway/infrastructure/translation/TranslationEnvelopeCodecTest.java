package com.toonlira.translationgateway.infrastructure.translation;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class TranslationEnvelopeCodecTest {
    private static final UUID JOB = UUID.fromString("12345678-1234-1234-1234-123456789012");
    private static final UUID ID = new UUID(0, 1);
    private final TranslationEnvelopeCodec codec = new TranslationEnvelopeCodec();

    private static TranslationRequest request(String text) {
        return new TranslationRequest(JOB, new LanguagePair("en", "pt-BR"), List.of(new TranslationRequest.Region(ID, 0, text)));
    }

    @Test
    void wrapsProtectedLiteralsAndEscapesEverythingElse() {
        String html = codec.encode(request("Open YouTube <now> at https://example.com/a and run $wget"));
        assertThat(html).contains("<span translate=\"no\">YouTube</span>", "&lt;now&gt;",
            "<span translate=\"no\">https://example.com/a</span>", "<span translate=\"no\">$wget</span>");
    }

    @Test
    void ordinaryWordsAndAllCapsLetteringAreLeftToTheTranslator() {
        assertThat(codec.encode(request("Windows are open and the door is shut."))).doesNotContain("translate=\"no\"");
        assertThat(codec.encode(request("THE COMMAND LINE ROCKS!"))).doesNotContain("translate=\"no\"");
    }

    @Test
    void decodeRemovesProviderSpacesBetweenProtectedTermsAndPunctuation() {
        var decoded = codec.decode("<div><p data-region=\"" + ID + "\">Obrigado por chamá-lo <span translate=\"no\">Ubuntu</span> !"
            + " Use ( <span translate=\"no\">wget</span> ) e <span translate=\"no\">GNOME</span> agora.</p></div>");
        assertThat(decoded.regions().getFirst().translatedText())
            .isEqualTo("Obrigado por chamá-lo Ubuntu! Use (wget) e GNOME agora.");
    }

    @Test
    void decodeTightensAQuotedProtectedTerm() {
        var decoded = codec.decode("<div><p data-region=\"" + ID + "\">Não &quot;Ubunchu&quot;, mas &quot; <span translate=\"no\">Ubuntu</span> &quot;."
            + " Diga \" <span translate=\"no\">GNOME</span> \" e \"oi\" <span translate=\"no\">Linux</span> \"fim\"</p></div>");
        assertThat(decoded.regions().getFirst().translatedText())
            .isEqualTo("Não \"Ubunchu\", mas \"Ubuntu\". Diga \"GNOME\" e \"oi\" Linux \"fim\"");
    }

    @Test
    void decodeStripsProtectionSpansButKeepsLiterals() {
        var decoded = codec.decode("<div><p data-region=\"" + ID + "\">Abra o <span translate=\"no\">YouTube</span> agora</p></div>");
        assertThat(decoded.regions().getFirst().translatedText()).isEqualTo("Abra o YouTube agora");
    }

    @Test
    void regionThatLostAProtectedLiteralFallsBackToSource() {
        var req = request("Install XFCE now");
        var lost = codec.restoreProtected(req, new TranslationResponse(List.of(new TranslationResponse.Region(ID, "Instale o Xfce agora"))));
        var kept = codec.restoreProtected(req, new TranslationResponse(List.of(new TranslationResponse.Region(ID, "Instale o XFCE agora"))));
        assertThat(lost.regions().getFirst().translatedText()).isEqualTo("Install XFCE now");
        assertThat(kept.regions().getFirst().translatedText()).isEqualTo("Instale o XFCE agora");
    }

    @Test
    void literalOnlyTextIsRecognised() {
        assertThat(codec.isLiteralOnly("15", "en")).isTrue();
        assertThat(codec.isLiteralOnly("https://example.com/a", "en")).isTrue();
        assertThat(codec.isLiteralOnly("YouTube", "en")).isTrue();
        assertThat(codec.isLiteralOnly("Open YouTube", "en")).isFalse();
        assertThat(codec.isLiteralOnly("case_Wellcome.pdf", "en")).isTrue();
        assertThat(codec.isLiteralOnly("case_ubuntu_ johnhopkins_v2.pdf", "en")).isTrue();
        assertThat(codec.isLiteralOnly("Open notes.txt now", "en")).isFalse();
        assertThat(codec.isLiteralOnly("It is the end.", "en")).isFalse(); // a sentence end is not an extension
        assertThat(codec.isLiteralOnly("e.g. this", "en")).isFalse();
    }
}
