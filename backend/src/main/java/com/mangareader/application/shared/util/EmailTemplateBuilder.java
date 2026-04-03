package com.mangareader.application.shared.util;

/**
 * Builder para templates de email HTML padronizados.
 * <p>
 * Gera HTML com layout consistente: header roxo, corpo, footer "Manga Reader".
 * Uso:
 * <pre>
 * String html = EmailTemplateBuilder.create()
 *     .title("Titulo")
 *     .paragraph("Corpo do email")
 *     .button("Acao", "https://link")
 *     .build();
 * </pre>
 */
public final class EmailTemplateBuilder {
    private static final String BRAND_COLOR = "#7c3aed";
    private static final String FOOTER_TEXT = "Manga Reader — Sua plataforma de mangás";

    private String title;
    private final StringBuilder bodyContent = new StringBuilder();

    private EmailTemplateBuilder() {
    }

    public static EmailTemplateBuilder create() {
        return new EmailTemplateBuilder();
    }

    public EmailTemplateBuilder title(String title) {
        this.title = title;

        return this;
    }

    public EmailTemplateBuilder paragraph(String text) {
        bodyContent.append("<p>").append(text).append("</p>");

        return this;
    }

    public EmailTemplateBuilder heading(String text) {
        bodyContent.append("<h3 style=\"color: ").append(BRAND_COLOR).append(";\">")
                .append(text).append("</h3>");

        return this;
    }

    public EmailTemplateBuilder field(String label, String value) {
        bodyContent.append("<p><strong>").append(label).append(":</strong> ")
                .append(value).append("</p>");

        return this;
    }

    public EmailTemplateBuilder button(String label, String url) {
        bodyContent.append("""
                <p style="text-align: center; margin: 30px 0;">
                    <a href="%s"
                       style="background-color: %s; color: white; padding: 12px 30px;
                              text-decoration: none; border-radius: 6px; font-weight: bold;">
                        %s
                    </a>
                </p>
                """.formatted(url, BRAND_COLOR, label));

        return this;
    }

    public EmailTemplateBuilder divider() {
        bodyContent.append("<hr style=\"border: none; border-top: 1px solid #eee; margin: 20px 0;\">");

        return this;
    }

    public String build() {
        var titleHtml = title != null
                ? "<h2 style=\"color: %s;\">%s</h2>".formatted(BRAND_COLOR, title)
                : "";

        return """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    %s
                    %s
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">%s</p>
                </div>
                """.formatted(titleHtml, bodyContent.toString(), FOOTER_TEXT);
    }
}
