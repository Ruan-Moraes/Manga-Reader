package com.mangareader.application.auth.usecase;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.shared.port.EmailPort;
import com.mangareader.application.user.port.UserRepositoryPort;

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

    @Value("${app.mail.base-url:http://localhost:5173}")
    private String baseUrl;

    public void execute(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String resetToken = tokenPort.generatePasswordResetToken(user.getId(), user.getEmail());
            String resetUrl = baseUrl + "/reset-password?token=" + resetToken;

            log.debug("Password reset solicitado para: {}", email);

            emailPort.sendHtml(
                    email,
                    "Manga Reader — Recuperação de Senha",
                    buildResetEmailHtml(user.getName(), resetUrl)
            );
        });
        // Sempre silencioso — não revela se o email existe
    }

    private String buildResetEmailHtml(String username, String resetUrl) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #7c3aed;">🔒 Recuperação de Senha</h2>
                    <p>Olá, <strong>%s</strong>!</p>
                    <p>Recebemos uma solicitação para redefinir sua senha no <strong>Manga Reader</strong>.</p>
                    <p>Clique no botão abaixo para criar uma nova senha:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="%s"
                           style="background-color: #7c3aed; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Redefinir Senha
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Se você não solicitou esta ação, ignore este email. O link expira em 15 minutos.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">Manga Reader — Sua plataforma de mangás</p>
                </div>
                """.formatted(username, resetUrl);
    }
}
