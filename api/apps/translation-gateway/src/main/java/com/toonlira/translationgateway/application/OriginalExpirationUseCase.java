package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.GatewayRepository;
import java.time.Clock;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OriginalExpirationUseCase {
    private static final int BATCH_SIZE = 100;
    private final GatewayRepository repository;
    private final Clock clock;
    public OriginalExpirationUseCase(GatewayRepository repository, Clock clock) { this.repository = repository; this.clock = clock; }
    @Transactional public int execute() { return repository.expireOriginals(BATCH_SIZE, clock.instant()); }
}
