package com.mangareader.infrastructure.security.jwt;

import java.time.LocalDateTime;

import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Higiene da tabela {@code refresh_tokens}: remove diariamente tokens já
 * expirados há mais de 1 dia. Tokens revogados recentes permanecem até
 * expirar — são eles que permitem detectar reuso dentro da janela de vida.
 */
@Slf4j
@Component
@EnableScheduling
@Profile("!test")
@RequiredArgsConstructor
public class RefreshTokenCleanupJob {
    private static final String DAILY_AT_4AM = "0 0 4 * * *";

    private final RefreshTokenRepositoryPort refreshTokenRepository;

    @Scheduled(cron = DAILY_AT_4AM)
    public void purgeExpiredTokens() {
        long removed = refreshTokenRepository.deleteExpiredBefore(LocalDateTime.now().minusDays(1));

        if (removed > 0) {
            log.info("RefreshTokenCleanupJob: {} refresh tokens expirados removidos", removed);
        }
    }
}
