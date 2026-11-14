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
    void doesNotProtectTermsInsideLongerWords() {
        assertThat(codec.encode(request("Linuxish and Ubuntuland"))).doesNotContain("translate=\"no\"");
    }

    @Test
    void decodeRemovesProviderSpacesBetweenProtectedTermsAndPunctuation() {
        var decoded = codec.decode("<div><p data-region=\"" + ID + "\">Obrigado por chamá-lo <span translate=\"no\">Ubuntu</span> !"
            + " Use ( <span translate=\"no\">wget</span> ) e <span translate=\"no\">GNOME</span> agora.</p></div>");
        assertThat(decoded.regions().getFirst().translatedText())
            .isEqualTo("Obrigado por chamá-lo Ubuntu! Use (wget) e GNOME agora.");
    }

    @Test
    void decodeStripsProtectionSpansButKeepsLiterals() {
        var decoded = codec.decode("<div><p data-region=\"" + ID + "\">Abra o <span translate=\"no\">YouTube</span> agora</p></div>");
        assertThat(decoded.regions().getFirst().translatedText()).isEqualTo("Abra o YouTube agora");
    }

    @Test
    void regionThatLostAProtectedLiteralFallsBackToSource() {
        var req = request("Install GNOME now");
        var lost = codec.restoreProtected(req, new TranslationResponse(List.of(new TranslationResponse.Region(ID, "Instale o Gnomo agora"))));
        var kept = codec.restoreProtected(req, new TranslationResponse(List.of(new TranslationResponse.Region(ID, "Instale o GNOME agora"))));
        assertThat(lost.regions().getFirst().translatedText()).isEqualTo("Install GNOME now");
        assertThat(kept.regions().getFirst().translatedText()).isEqualTo("Instale o GNOME agora");
    }

    @Test
    void literalOnlyTextIsRecognised() {
        assertThat(codec.isLiteralOnly("15")).isTrue();
        assertThat(codec.isLiteralOnly("https://example.com/a")).isTrue();
        assertThat(codec.isLiteralOnly("YouTube")).isTrue();
        assertThat(codec.isLiteralOnly("Open YouTube")).isFalse();
    }
}
