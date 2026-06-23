package com.mangareader.infrastructure.seed;

import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreAvailability;
import com.mangareader.domain.store.valueobject.StoreCategory;
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
                        .ratingCount(9540)
                        .category(StoreCategory.NOVA)
                        .official(true)
                        .price(3990)
                        .oldPrice(4490)
                        .format("Volume único · brochura")
                        .shipping("Entrega Prime em 1 dia")
                        .mono("A")
                        .color("#ff9900")
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
                        .rating(4.9)
                        .ratingCount(1820)
                        .category(StoreCategory.OFICIAL)
                        .official(true)
                        .price(4490)
                        .oldPrice(4990)
                        .format("Volume único · capa dura")
                        .shipping("Frete grátis acima de R$ 99")
                        .note("Edição nacional licenciada")
                        .mono("P")
                        .color("#e23744")
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
                        .ratingCount(980)
                        .category(StoreCategory.NOVA)
                        .price(4500)
                        .format("Volume único · brochura")
                        .shipping("Frete grátis acima de R$ 120")
                        .mono("LC")
                        .color("#1f9e6b")
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
                        .ratingCount(2110)
                        .category(StoreCategory.OFICIAL)
                        .official(true)
                        .price(3990)
                        .format("Volume único · brochura")
                        .shipping("Frete grátis para assinantes")
                        .mono("JB")
                        .color("#5b6cff")
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
                        .ratingCount(760)
                        .category(StoreCategory.OFICIAL)
                        .official(true)
                        .price(4290)
                        .format("Volume único · brochura")
                        .shipping("Frete a calcular")
                        .mono("NP")
                        .color("#ff5fa2")
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
                        .rating(4.5)
                        .ratingCount(3210)
                        .category(StoreCategory.NOVA)
                        .price(4250)
                        .format("Volume único · brochura")
                        .shipping("Retirada em loja disponível")
                        .mono("M")
                        .color("#0086ff")
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
                        .ratingCount(640)
                        .category(StoreCategory.NOVA)
                        .price(4790)
                        .format("Volume único · brochura")
                        .shipping("Pré-venda — envio na data de lançamento")
                        .note("Pré-venda")
                        .mono("CX")
                        .color("#f59e0b")
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
                        .ratingCount(8800)
                        .category(StoreCategory.USADO)
                        .price(2890)
                        .format("Usado · bom estado")
                        .shipping("Frete grátis acima de R$ 79")
                        .mono("SH")
                        .color("#ee4d2d")
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
                        .ratingCount(5120)
                        .category(StoreCategory.USADO)
                        .price(2490)
                        .format("Usado · capa desgastada")
                        .shipping("Frete por vendedor")
                        .note("Esgotado para edições populares")
                        .mono("ML")
                        .color("#ffe600")
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
                        .rating(4.2)
                        .ratingCount(1430)
                        .category(StoreCategory.NOVA)
                        .price(4690)
                        .oldPrice(4990)
                        .format("Volume único · brochura")
                        .shipping("Pré-venda — frete grátis")
                        .note("Edição especial")
                        .mono("SV")
                        .color("#0aa")
                        .features(List.of("Pré-venda", "Edições especiais"))
                        .build()
        );

        storeRepository.saveAll(stores);

        log.info("✓ {} lojas de demonstração criadas.", stores.size());
    }
}
