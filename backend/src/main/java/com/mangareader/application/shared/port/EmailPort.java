package com.mangareader.application.shared.port;

/**
 * Port de saída para envio de emails.
 * <p>
 * Cada profile utiliza uma implementação diferente:
 * <ul>
 *   <li><b>dev</b>: Console (log)</li>
 *   <li><b>prod</b>: SMTP real</li>
 *   <li><b>test</b>: Noop</li>
 * </ul>
 */
public interface EmailPort {

    /**
     * Envia um email simples (texto plano).
     */
    void send(String to, String subject, String body);

    /**
     * Envia um email com corpo HTML.
     */
    void sendHtml(String to, String subject, String htmlBody);
}
