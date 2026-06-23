package com.mangareader.infrastructure.seed;

import java.util.Comparator;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {
    private final List<EntitySeeder> seeders;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Iniciando seed de dados de demonstração...");

        seeders.stream()
                .sorted(Comparator.comparingInt(EntitySeeder::getOrder))
                .forEach(EntitySeeder::seed);

        log.info("Seed de dados de demonstração concluído.");
    }
}
