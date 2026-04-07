package com.mangareader.infrastructure.email;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.application.shared.port.EmailPort;

import lombok.extern.slf4j.Slf4j;

/**
 * Adapter de email para desenvolvimento — imprime no console.
 */
@Slf4j
@Component
@Profile("dev | default")
public class ConsoleEmailAdapter implements EmailPort {
    @Override
    public void send(String to, String subject, String body) {
        log.info("""

                ═══════════════════════════════════════════════════════
                📧  EMAIL (console — dev)
                ───────────────────────────────────────────────────────
                Para:    {}
                Assunto: {}
                ───────────────────────────────────────────────────────
                {}
                ═══════════════════════════════════════════════════════
                """, to, subject, body);
    }

    @Override
    public void sendHtml(String to, String subject, String htmlBody) {
        log.info("""

                ═══════════════════════════════════════════════════════
                📧  EMAIL HTML (console — dev)
                ───────────────────────────────────────────────────────
                Para:    {}
                Assunto: {}
                ───────────────────────────────────────────────────────
                {}
                ═══════════════════════════════════════════════════════
                """, to, subject, htmlBody);
    }
}
