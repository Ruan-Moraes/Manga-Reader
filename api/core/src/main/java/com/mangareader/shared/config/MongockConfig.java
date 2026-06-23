package com.mangareader.shared.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import io.mongock.runner.springboot.EnableMongock;

/**
 * Habilita o Mongock para gerenciar migrations do MongoDB.
 * <p>
 * O pacote de changelogs é definido em {@code mongock.migration-scan-package}
 * no application.yml.
 * <p>
 * Desabilitado no profile "test" para evitar dependência de MongoDB
 * em testes que usam apenas H2 in-memory.
 */
@Configuration
@EnableMongock
@Profile("!test")
public class MongockConfig {
}
