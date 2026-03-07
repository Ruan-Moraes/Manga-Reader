package com.mangareader.infrastructure.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import com.mangareader.application.shared.port.EmailPort;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Adapter SMTP real — ativo apenas em produção.
 */
@Slf4j
@Component
@Profile("prod")
@RequiredArgsConstructor
public class SmtpEmailAdapter implements EmailPort {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@mangareader.com}")
    private String fromAddress;

    @Override
    public void send(String to, String subject, String body) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
            log.info("📧 Email enviado para: {}", to);
        } catch (MessagingException e) {
            log.error("❌ Falha ao enviar email para {}: {}", to, e.getMessage());
            throw new RuntimeException("Falha ao enviar email", e);
        }
    }

    @Override
    public void sendHtml(String to, String subject, String htmlBody) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("📧 Email HTML enviado para: {}", to);
        } catch (MessagingException e) {
            log.error("❌ Falha ao enviar email HTML para {}: {}", to, e.getMessage());
            throw new RuntimeException("Falha ao enviar email", e);
        }
    }
}
