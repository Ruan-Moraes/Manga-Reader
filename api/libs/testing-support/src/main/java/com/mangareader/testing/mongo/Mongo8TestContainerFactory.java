package com.mangareader.testing.mongo;

import java.time.Duration;

import org.testcontainers.containers.MongoDBContainer;

/**
 * Fonte única para a imagem e os workarounds operacionais do MongoDB usado nos
 * testes de integração do monorepo.
 */
public final class Mongo8TestContainerFactory {
    public static final String IMAGE = "mongo:8.0.26";
    public static final String RSEQ_TUNABLE = "glibc.pthread.rseq=1";

    private Mongo8TestContainerFactory() {}

    public static MongoDBContainer create() {
        return configure(new MongoDBContainer(IMAGE));
    }

    /**
     * Variante cujo fechamento por um contexto Spring é ignorado. O Ryuk ainda
     * remove o container ao terminar a JVM.
     */
    public static MongoDBContainer createJvmSingleton() {
        return configure(new MongoDBContainer(IMAGE) {
            @Override
            public void stop() {
                // Singleton compartilhado entre contextos do mesmo processo de teste.
            }
        });
    }

    private static MongoDBContainer configure(MongoDBContainer container) {
        return container
                .withEnv("GLIBC_TUNABLES", RSEQ_TUNABLE)
                .withStartupTimeout(Duration.ofSeconds(120));
    }
}
