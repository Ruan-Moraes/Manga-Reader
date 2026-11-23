package com.toonlira.translationgateway.infrastructure.job;

import com.toonlira.translationgateway.application.VolatileAttemptUseCase;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@ConditionalOnProperty(name = "gateway.volatile-processing-enabled", havingValue = "true")
public class VolatileReceiptCleanup {
    private static final Logger LOGGER = LoggerFactory.getLogger(VolatileReceiptCleanup.class);
    private final VolatileAttemptUseCase attempts;
    public VolatileReceiptCleanup(VolatileAttemptUseCase attempts) { this.attempts = attempts; }
    @Scheduled(fixedDelay = 3_600_000, initialDelay = 1_000)
    public void execute() {
        try { LOGGER.info("event=volatile_receipts_purged count={}", attempts.purgeExpired()); }
        catch (RuntimeException error) { LOGGER.warn("event=volatile_receipt_cleanup_failed exception_type={}", error.getClass().getSimpleName()); }
    }
}
