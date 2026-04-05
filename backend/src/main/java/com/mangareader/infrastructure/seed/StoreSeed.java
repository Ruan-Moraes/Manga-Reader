package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreAvailability;
import com.mangareader.infrastructure.persistence.postgres.repository.StoreJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class StoreSeed implements EntitySeeder {
    private final StoreJpaRepository storeRepository;

    @Override
    public int getOrder() {
        return 11;
    }

    @Override
    public void seed() {
        if (storeRepository.count() > 0) {
            log.info("Stores já existem — seed de stores ignorado.");

            return;
        }

        var stores = List.of(
                Store.builder()
                        .name("Amazon")
                        .icon("amazon")
                        .description("Marketplace oficial com catálogo variado e entrega rápida.")
                        .website("https://amazon.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.7)
                        .features(List.of("Entrega rápida", "Prime", "Frete grátis"))
                        .build(),
                Store.builder()
                        .name("Panini")
                        .icon("panini")
                        .description("Editora parceira com lançamentos frequentes e edições exclusivas.")
                        .website("https://panini.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.5)
                        .features(List.of("Lançamentos", "Edições exclusivas"))
                        .build(),
                Store.builder()
                        .name("Livraria Cultura")
                        .description("Livraria com seção dedicada a mangás e eventos literários.")
                        .website("https://livrariacultura.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.3)
                        .features(List.of("Curadoria", "Eventos"))
                        .build(),
                Store.builder()
                        .name("JBC")
                        .icon("default")
                        .description("Editora com foco em mangás e light novels brasileiros.")
                        .website("https://editorajbc.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.6)
                        .features(List.of("Editora oficial", "Assinatura mensal"))
                        .build(),
                Store.builder()
                        .name("NewPOP")
                        .icon("default")
                        .description("Manhwas, mangás e publicações de nicho para leitores exigentes.")
                        .website("https://newpop.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.4)
                        .features(List.of("Manhwa", "Edições premium"))
                        .build(),
                Store.builder()
                        .name("Magalu")
                        .icon("default")
                        .description("Grande varejo online com preços competitivos e promoções.")
                        .website("https://magazineluiza.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.1)
                        .features(List.of("Cashback", "Parcelamento"))
                        .build(),
                Store.builder()
                        .name("Comix")
                        .icon("default")
                        .description("Loja especializada em mangás, HQs e colecionáveis.")
                        .website("https://comix.com.br")
                        .availability(StoreAvailability.PRE_ORDER)
                        .rating(4.8)
                        .features(List.of("Colecionáveis", "Pré-venda"))
                        .build(),
                Store.builder()
                        .name("Shopee")
                        .icon("default")
                        .description("Marketplace com vendedores independentes e ofertas diárias.")
                        .website("https://shopee.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(3.9)
                        .features(List.of("Frete grátis", "Cupons"))
                        .build()
        );

        storeRepository.saveAll(stores);

        log.info("✓ {} lojas de demonstração criadas.", stores.size());
    }
}
