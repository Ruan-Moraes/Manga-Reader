package com.mangareader.trending.web;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.mangareader.trending.application.RecalculateTrendingUseCase;

@RestController
@RequestMapping("/admin")
public class AdminReconcileController {
    private static final Logger LOGGER = LoggerFactory.getLogger(AdminReconcileController.class);

    private final RecalculateTrendingUseCase useCase;
    private final String adminToken;

    public AdminReconcileController(RecalculateTrendingUseCase useCase,
            @Value("${trending.admin.token:}") String adminToken) {
        this.useCase = useCase;
        this.adminToken = adminToken;
    }

    @PostMapping("/reconcile")
    public ResponseEntity<Map<String, Object>> reconcile(@RequestHeader(value = "X-Admin-Token", required = false) String supplied) {
        if (adminToken == null || adminToken.isBlank()) {
            LOGGER.warn("Reconcile manual desativado — trending.admin.token não configurado");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "admin token not configured"));
        }
        if (!matches(supplied)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "invalid admin token"));
        }
        return ResponseEntity.ok(Map.of("titlesProcessed", useCase.execute()));
    }

    private boolean matches(String supplied) {
        if (supplied == null) return false;
        return MessageDigest.isEqual(supplied.getBytes(StandardCharsets.UTF_8),
                adminToken.getBytes(StandardCharsets.UTF_8));
    }
}
