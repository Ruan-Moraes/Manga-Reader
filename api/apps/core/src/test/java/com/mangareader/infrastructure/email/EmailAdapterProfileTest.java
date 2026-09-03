package com.mangareader.infrastructure.email;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import com.mangareader.application.shared.port.EmailPort;

class EmailAdapterProfileTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(EmailAdaptersConfig.class);

    @Test
    void defaultProfileLoadsOnlyConsoleAdapter() {
        contextRunner.run(context -> {
            assertThat(context).hasSingleBean(EmailPort.class);
            assertThat(context).hasSingleBean(ConsoleEmailAdapter.class);
            assertThat(context).doesNotHaveBean(NoopEmailAdapter.class);
        });
    }

    @Test
    void devProfileLoadsOnlyConsoleAdapter() {
        contextRunner
                .withPropertyValues("spring.profiles.active=dev")
                .run(context -> {
                    assertThat(context).hasSingleBean(EmailPort.class);
                    assertThat(context).hasSingleBean(ConsoleEmailAdapter.class);
                    assertThat(context).doesNotHaveBean(NoopEmailAdapter.class);
                });
    }

    @Test
    void testProfileLoadsOnlyNoopAdapter() {
        contextRunner
                .withPropertyValues("spring.profiles.active=test")
                .run(context -> {
                    assertThat(context).hasSingleBean(EmailPort.class);
                    assertThat(context).hasSingleBean(NoopEmailAdapter.class);
                    assertThat(context).doesNotHaveBean(ConsoleEmailAdapter.class);
                });
    }

    @Test
    void combinedDevAndTestProfilesStillLoadOnlyNoopAdapter() {
        contextRunner
                .withPropertyValues("spring.profiles.active=dev,test")
                .run(context -> {
                    assertThat(context).hasSingleBean(EmailPort.class);
                    assertThat(context).hasSingleBean(NoopEmailAdapter.class);
                    assertThat(context).doesNotHaveBean(ConsoleEmailAdapter.class);
                });
    }

    @Configuration(proxyBeanMethods = false)
    @Import({ ConsoleEmailAdapter.class, NoopEmailAdapter.class })
    static class EmailAdaptersConfig {
    }
}
