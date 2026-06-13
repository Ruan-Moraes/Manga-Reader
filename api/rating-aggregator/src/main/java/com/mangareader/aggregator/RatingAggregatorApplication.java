package com.mangareader.aggregator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Serviço de agregação de avaliações.
 * <p>
 * Mantém a coleção {@code reviews_aggregate} (fonte oficial de nota/contagem)
 * a partir de dois gatilhos:
 * <ul>
 *   <li>eventos {@code rating.*} consumidos do RabbitMQ (submit/update/delete);</li>
 *   <li>job {@code @Scheduled} de reconciliação (rede de segurança).</li>
 * </ul>
 */
@SpringBootApplication
@EnableScheduling
public class RatingAggregatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(RatingAggregatorApplication.class, args);
    }
}
