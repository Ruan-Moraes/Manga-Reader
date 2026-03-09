package com.mangareader.infrastructure.email;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.application.shared.port.EmailPort;

/**
 * Adapter de email para testes — não faz nada.
 */
@Component
@Profile("test")
public class NoopEmailAdapter implements EmailPort {

    @Override
    public void send(String to, String subject, String body) {
        // No-op
    }

    @Override
    public void sendHtml(String to, String subject, String htmlBody) {
        // No-op
    }
}
