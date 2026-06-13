package com.mangareader.reconciler.web;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.reconciler.scheduling.CounterReconciliationJob;
import com.mangareader.reconciler.scheduling.ReconciliationReport;

import lombok.extern.slf4j.Slf4j;

/**
 * Gatilho manual de reconciliação de <b>todos</b> os contadores.
 * <p>
 * Protegido por senha (token): o request deve enviar o header
 * {@code X-Admin-Token} igual ao valor de {@code reconciler.admin.token}
 * (sobrescrever via env {@code RECONCILER_ADMIN_TOKEN} em produção). Sem token
 * configurado, o endpoint fica desativado (responde 503) para nunca ficar aberto.
 */
@RestController
@RequestMapping("/admin")
@Slf4j
public class AdminReconcileController {
    private final CounterReconciliationJob reconciliationJob;
    private final String adminToken;

    public AdminReconcileController(
            CounterReconciliationJob reconciliationJob,
            @Value("${reconciler.admin.token:}") String adminToken) {
        this.reconciliationJob = reconciliationJob;
        this.adminToken = adminToken;
    }

    @PostMapping("/reconcile")
    public ResponseEntity<Map<String, Object>> reconcile(
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {

        if (adminToken == null || adminToken.isBlank()) {
            log.warn("Reconcile manual desativado — reconciler.admin.token não configurado");

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "admin token not configured"));
        }

        if (!matches(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "invalid admin token"));
        }

        ReconciliationReport report = reconciliationJob.reconcile();

        log.info("Reconcile manual concluído — groups={}, events={}, forum_topics={}, votos={}",
                report.groups(), report.events(), report.forumReplies(), report.votes());

        return ResponseEntity.ok(Map.of(
                "groups", report.groups(),
                "events", report.events(),
                "forumReplies", report.forumReplies(),
                "votes", report.votes()));
    }

    /** Comparação em tempo constante (evita timing attack na senha). */
    private boolean matches(String token) {
        if (token == null) return false;

        return MessageDigest.isEqual(
                token.getBytes(StandardCharsets.UTF_8),
                adminToken.getBytes(StandardCharsets.UTF_8));
    }
}
