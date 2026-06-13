package com.mangareader.reconciler;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Serviço de reconciliação dos contadores desnormalizados.
 * <p>
 * Os use cases da API principal mantêm os contadores por incremento; este
 * serviço os recalcula periodicamente a partir de sua fonte (bulk update
 * idempotente {@code SET = COUNT}), corrigindo divergências sem risco de
 * double-count. Dois gatilhos:
 * <ul>
 *   <li>job {@code @Scheduled} de reconciliação (rede de segurança);</li>
 *   <li>gatilho manual {@code POST /admin/reconcile} (protegido por token).</li>
 * </ul>
 */
@SpringBootApplication
@EnableScheduling
public class CounterReconcilerApplication {
    public static void main(String[] args) {
        SpringApplication.run(CounterReconcilerApplication.class, args);
    }
}
