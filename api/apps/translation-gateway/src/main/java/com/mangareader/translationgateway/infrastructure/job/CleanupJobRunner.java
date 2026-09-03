package com.mangareader.translationgateway.infrastructure.job;

import com.mangareader.translationgateway.application.CleanupGatewayUseCase;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("cleanup-job")
public class CleanupJobRunner implements ApplicationRunner {
    private final CleanupGatewayUseCase cleanup;
    private final ConfigurableApplicationContext context;

    public CleanupJobRunner(CleanupGatewayUseCase cleanup, ConfigurableApplicationContext context) {
        this.cleanup = cleanup;
        this.context = context;
    }

    @Override
    public void run(ApplicationArguments args) {
        cleanup.execute();
        context.close();
    }
}
