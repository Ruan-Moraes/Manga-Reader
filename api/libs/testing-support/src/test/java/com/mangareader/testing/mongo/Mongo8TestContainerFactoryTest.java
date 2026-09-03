package com.mangareader.testing.mongo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class Mongo8TestContainerFactoryTest {
    @Test
    void appliesTheSharedMongoImageAndKernelWorkaround() {
        var container = Mongo8TestContainerFactory.create();

        assertThat(Mongo8TestContainerFactory.IMAGE).isEqualTo("mongo:8.0.26");
        assertThat(container.getEnvMap())
                .containsEntry("GLIBC_TUNABLES", Mongo8TestContainerFactory.RSEQ_TUNABLE);
    }
}
