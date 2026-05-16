package com.mangareader.infrastructure.seed;

import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.shared.domain.i18n.LocalizedString;
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

    private static LocalizedString ls(String pt, String en, String es) {
        return LocalizedString.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es));
    }

    private static LocalizedString brand(String name) {
        return LocalizedString.of(Map.of("pt-BR", name, "en-US", name, "es-ES", name));
    }

    @Override
    public void seed() {
        if (storeRepository.count() > 0) {
            log.info("Stores já existem — seed de stores ignorado.");

            return;
        }

        var stores = List.of(
                Store.builder()
                        .name(brand("Amazon"))
                        .icon("amazon")
                        .description(ls(
                                "Marketplace oficial com catálogo variado e entrega rápida.",
                                "Official marketplace with a varied catalog and fast delivery.",
                                "Marketplace oficial con catálogo variado y entrega rápida."))
                        .website("https://amazon.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.7)
                        .features(List.of("Entrega rápida", "Prime", "Frete grátis"))
                        .build(),
                Store.builder()
                        .name(brand("Panini"))
                        .icon("panini")
                        .description(ls(
                                "Editora parceira com lançamentos frequentes e edições exclusivas.",
                                "Partner publisher with frequent releases and exclusive editions.",
                                "Editorial asociada con lanzamientos frecuentes y ediciones exclusivas."))
                        .website("https://panini.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.5)
                        .features(List.of("Lançamentos", "Edições exclusivas"))
                        .build(),
                Store.builder()
                        .name(brand("Livraria Cultura"))
                        .description(ls(
                                "Livraria com seção dedicada a mangás e eventos literários.",
                                "Bookstore with a dedicated manga section and literary events.",
                                "Librería con sección dedicada a mangas y eventos literarios."))
                        .website("https://livrariacultura.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.3)
                        .features(List.of("Curadoria", "Eventos"))
                        .build(),
                Store.builder()
                        .name(brand("JBC"))
                        .icon("default")
                        .description(ls(
                                "Editora com foco em mangás e light novels brasileiros.",
                                "Publisher focused on Brazilian manga and light novels.",
                                "Editorial enfocada en mangas y light novels brasileños."))
                        .website("https://editorajbc.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.6)
                        .features(List.of("Editora oficial", "Assinatura mensal"))
                        .build(),
                Store.builder()
                        .name(brand("NewPOP"))
                        .icon("default")
                        .description(ls(
                                "Manhwas, mangás e publicações de nicho para leitores exigentes.",
                                "Manhwa, manga and niche publications for demanding readers.",
                                "Manhwas, mangas y publicaciones de nicho para lectores exigentes."))
                        .website("https://newpop.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.4)
                        .features(List.of("Manhwa", "Edições premium"))
                        .build(),
                Store.builder()
                        .name(brand("Magalu"))
                        .icon("default")
                        .description(ls(
                                "Grande varejo online com preços competitivos e promoções.",
                                "Major online retailer with competitive prices and promotions.",
                                "Gran minorista en línea con precios competitivos y promociones."))
                        .website("https://magazineluiza.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.1)
                        .features(List.of("Cashback", "Parcelamento"))
                        .build(),
                Store.builder()
                        .name(brand("Comix"))
                        .icon("default")
                        .description(ls(
                                "Loja especializada em mangás, HQs e colecionáveis.",
                                "Store specialized in manga, comics and collectibles.",
                                "Tienda especializada en mangas, cómics y coleccionables."))
                        .website("https://comix.com.br")
                        .availability(StoreAvailability.PRE_ORDER)
                        .rating(4.8)
                        .features(List.of("Colecionáveis", "Pré-venda"))
                        .build(),
                Store.builder()
                        .name(brand("Shopee"))
                        .icon("default")
                        .description(ls(
                                "Marketplace com vendedores independentes e ofertas diárias.",
                                "Marketplace with independent sellers and daily offers.",
                                "Marketplace con vendedores independientes y ofertas diarias."))
                        .website("https://shopee.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(3.9)
                        .features(List.of("Frete grátis", "Cupons"))
                        .build(),
                Store.builder()
                        .name(brand("Mercado Livre"))
                        .icon("default")
                        .description(ls(
                                "Marketplace com grande variedade, mas estoque esgotado para edições populares.",
                                "Marketplace with wide variety but out of stock for popular editions.",
                                "Marketplace con gran variedad, pero stock agotado para ediciones populares."))
                        .website("https://mercadolivre.com.br")
                        .availability(StoreAvailability.OUT_OF_STOCK)
                        .rating(3.5)
                        .features(List.of("Marketplace", "Vendedores terceiros"))
                        .build(),
                Store.builder()
                        .name(brand("Saraiva"))
                        .icon("default")
                        .description(ls(
                                "Livraria com pré-venda de lançamentos e edições especiais.",
                                "Bookstore with pre-orders of new releases and special editions.",
                                "Librería con preventa de lanzamientos y ediciones especiales."))
                        .website("https://saraiva.com.br")
                        .availability(StoreAvailability.PRE_ORDER)
                        .features(List.of("Pré-venda", "Edições especiais"))
                        .build()
        );

        storeRepository.saveAll(stores);

        log.info("✓ {} lojas de demonstração criadas.", stores.size());
    }
}
