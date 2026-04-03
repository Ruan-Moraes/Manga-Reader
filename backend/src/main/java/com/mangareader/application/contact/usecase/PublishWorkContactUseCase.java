package com.mangareader.application.contact.usecase;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.mangareader.application.shared.port.EmailPort;
import com.mangareader.application.shared.util.EmailTemplateBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Processa solicitação de publicação de trabalho.
 * <p>
 * Envia email de notificação ao admin e email de confirmação ao autor.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PublishWorkContactUseCase {
    private final EmailPort emailPort;

    @Value("${app.mail.admin-email:admin@mangareader.com}")
    private String adminEmail;

    public void execute(PublishWorkInput input) {
        log.info("Nova solicitação de publicação recebida de: {}", input.email());

        sendAdminNotification(input);
        sendAuthorConfirmation(input);
    }

    private void sendAdminNotification(PublishWorkInput input) {
        String htmlBody = EmailTemplateBuilder.create()
                .title("\uD83D\uDCDD Nova Solicitação de Publicação")
                .paragraph("Um autor entrou em contato para publicar um trabalho.")
                .divider()
                .field("Nome", input.name())
                .field("Email", input.email())
                .field("Tipo de Trabalho", input.workType())
                .field("Título", input.workTitle())
                .field("Sinopse", input.synopsis())
                .field("Link do Portfólio", input.portfolioLink() != null && !input.portfolioLink().isBlank()
                        ? input.portfolioLink()
                        : "Não informado")
                .divider()
                .paragraph("<strong>Mensagem:</strong>")
                .paragraph(input.message())
                .build();

        emailPort.sendHtml(
                adminEmail,
                "Manga Reader — Nova Solicitação de Publicação: " + input.workTitle(),
                htmlBody
        );
    }

    private void sendAuthorConfirmation(PublishWorkInput input) {
        String htmlBody = EmailTemplateBuilder.create()
                .title("\u2705 Solicitação Recebida")
                .paragraph("Olá, <strong>" + input.name() + "</strong>!")
                .paragraph("Recebemos sua solicitação de publicação para o trabalho <strong>\"" + input.workTitle() + "\"</strong>.")
                .paragraph("Nossa equipe analisará seu envio e entrará em contato em breve.")
                .divider()
                .paragraph("<span style=\"color: #666; font-size: 14px;\">Se você não realizou esta solicitação, ignore este email.</span>")
                .build();

        emailPort.sendHtml(
                input.email(),
                "Manga Reader — Recebemos sua solicitação de publicação",
                htmlBody
        );
    }

    public record PublishWorkInput(
            String name,
            String email,
            String workType,
            String workTitle,
            String synopsis,
            String portfolioLink,
            String message
    ) {
    }
}
