package com.mangareader.infrastructure.scheduling;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Habilita agendamento de tarefas. Desativado no profile de teste para não iniciar
 * o scheduler nos contextos Spring dos testes.
 */
@Configuration
@EnableScheduling
@Profile("!test")
public class SchedulingConfig {
}
