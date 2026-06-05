package com.mangareader.application.shared.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("EmailTemplateBuilder")
class EmailTemplateBuilderTest {
    @Test
    @DisplayName("Deve gerar HTML com titulo")
    void deveGerarHtmlComTitulo() {
        String html = EmailTemplateBuilder.create()
                .title("Teste")
                .build();

        assertThat(html).contains("<h2 style=\"color: #7c3aed;\">Teste</h2>");
    }

    @Test
    @DisplayName("Deve gerar HTML sem titulo quando nao informado")
    void deveGerarHtmlSemTitulo() {
        String html = EmailTemplateBuilder.create()
                .paragraph("Conteudo")
                .build();

        assertThat(html).doesNotContain("<h2");
        assertThat(html).contains("<p>Conteudo</p>");
    }

    @Test
    @DisplayName("Deve gerar paragrafos")
    void deveGerarParagrafos() {
        String html = EmailTemplateBuilder.create()
                .paragraph("Primeiro")
                .paragraph("Segundo")
                .build();

        assertThat(html).contains("<p>Primeiro</p>");
        assertThat(html).contains("<p>Segundo</p>");
    }

    @Test
    @DisplayName("Deve gerar campos com label e valor")
    void deveGerarCampos() {
        String html = EmailTemplateBuilder.create()
                .field("Nome", "Ruan")
                .field("Email", "ruan@test.com")
                .build();

        assertThat(html).contains("<strong>Nome:</strong> Ruan");
        assertThat(html).contains("<strong>Email:</strong> ruan@test.com");
    }

    @Test
    @DisplayName("Deve gerar botao com link")
    void deveGerarBotao() {
        String html = EmailTemplateBuilder.create()
                .button("Clique aqui", "https://example.com")
                .build();

        assertThat(html).contains("href=\"https://example.com\"");
        assertThat(html).contains("Clique aqui");
        assertThat(html).contains("background-color: #7c3aed");
    }

    @Test
    @DisplayName("Deve gerar divisor")
    void deveGerarDivisor() {
        String html = EmailTemplateBuilder.create()
                .divider()
                .build();

        assertThat(html).contains("border-top: 1px solid #eee");
    }

    @Test
    @DisplayName("Deve incluir footer padrao")
    void deveIncluirFooter() {
        String html = EmailTemplateBuilder.create().build();

        assertThat(html).contains("Manga Reader — Sua plataforma de mangás");
    }

    @Test
    @DisplayName("Deve gerar heading")
    void deveGerarHeading() {
        String html = EmailTemplateBuilder.create()
                .heading("Secao")
                .build();

        assertThat(html).contains("<h3 style=\"color: #7c3aed;\">Secao</h3>");
    }

    @Test
    @DisplayName("Deve gerar template completo com todos os elementos")
    void deveGerarTemplateCompleto() {
        String html = EmailTemplateBuilder.create()
                .title("Titulo do Email")
                .paragraph("Paragrafo introdutorio")
                .divider()
                .field("Campo", "Valor")
                .button("Acao", "https://link.com")
                .build();

        assertThat(html)
                .contains("Titulo do Email")
                .contains("Paragrafo introdutorio")
                .contains("<strong>Campo:</strong> Valor")
                .contains("href=\"https://link.com\"")
                .contains("font-family: Arial, sans-serif")
                .contains("max-width: 600px");
    }
}
