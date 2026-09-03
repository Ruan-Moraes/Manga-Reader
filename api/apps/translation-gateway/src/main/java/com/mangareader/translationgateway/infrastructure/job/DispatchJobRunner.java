package com.mangareader.translationgateway.infrastructure.job;

import com.mangareader.translationgateway.application.DispatchPendingJobsUseCase;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dispatch-job")
public class DispatchJobRunner implements ApplicationRunner {
    private final DispatchPendingJobsUseCase dispatcher;
    private final ConfigurableApplicationContext context;

    public DispatchJobRunner(DispatchPendingJobsUseCase dispatcher, ConfigurableApplicationContext context) {
        this.dispatcher = dispatcher;
        this.context = context;
    }

    @Override
    public void run(ApplicationArguments args) {
        dispatcher.execute();
        context.close();
    }
}
