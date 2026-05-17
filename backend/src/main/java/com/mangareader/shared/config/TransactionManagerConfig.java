package com.mangareader.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import jakarta.persistence.EntityManagerFactory;

/**
 * Dois transaction managers coexistem: JPA (PostgreSQL) e Mongo.
 * <p>
 * O JPA é {@code @Primary} — todo {@code @Transactional} sem qualifier resolve
 * para ele (comportamento histórico de todo o backend). Use cases que escrevem
 * no MongoDB qualificam explicitamente com
 * {@code @Transactional("mongoTransactionManager")}.
 * <p>
 * O bean precisa ser declarado explicitamente: ao existir um
 * {@code MongoTransactionManager} no contexto, o auto-config do Spring Boot
 * deixa de criar o {@code transactionManager} JPA padrão.
 */
@Configuration
public class TransactionManagerConfig {

    @Bean
    @Primary
    public PlatformTransactionManager transactionManager(
            EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
