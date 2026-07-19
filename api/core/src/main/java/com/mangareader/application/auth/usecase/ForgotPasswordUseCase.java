package com.mangareader.application.auth.usecase;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.shared.port.EmailPort;
import com.mangareader.application.shared.util.EmailTemplateBuilder;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Processa solicitação de recuperação de senha.
 * <p>
 * Gera um token JWT do tipo "password_reset" e envia por email.
 * <p>
 * Sempre retorna mensagem genérica para não revelar se o email existe.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ForgotPasswordUseCase {
    private final UserRepositoryPort userRepository;
    private final TokenPort tokenPort;
    private final EmailPort emailPort;
    private final MessageSource messageSource;
    private final LocaleResolutionService localeResolutionService;

    @Value("${app.mail.base-url:http://localhost:5173}")
    private String baseUrl;

    public Duration execute(String email) {
        Duration expiration = tokenPort.passwordResetExpiration();

        userRepository.findByEmail(email).ifPresent(user -> {
            String resetToken = tokenPort.generatePasswordResetToken(
                    user.getId(), user.getEmail(), user.getPasswordHash());
            String resetUrl = baseUrl + "/reset-password?token=" + resetToken;

            log.debug("Password reset solicitado para: {}", email);

            emailPort.sendHtml(
                    email,
                    "Manga Reader — Recuperação de Senha",
                    buildResetEmailHtml(user.getName(), resetUrl, expiration)
            );
        });

        return expiration;
    }

    private String buildResetEmailHtml(String username, String resetUrl, Duration expiration) {
        String footer = messageSource.getMessage("email.footer.tagline", null, localeResolutionService.currentLocale());
        long expirationMinutes = Math.max(1, (expiration.toSeconds() + 59) / 60);
        String expirationUnit = expirationMinutes == 1 ? "minuto" : "minutos";

        return EmailTemplateBuilder.create()
                .title("\uD83D\uDD12 Recuperação de Senha")
                .paragraph("Olá, <strong>" + username + "</strong>!")
                .paragraph("Recebemos uma solicitação para redefinir sua senha no <strong>Manga Reader</strong>.")
                .paragraph("Clique no botão abaixo para criar uma nova senha:")
                .button("Redefinir Senha", resetUrl)
                .paragraph("<span style=\"color: #666; font-size: 14px;\">Se você não solicitou esta ação, ignore este email. O link expira em "
                        + expirationMinutes + " " + expirationUnit + ".</span>")
                .footer(footer)
                .build();
    }
}
