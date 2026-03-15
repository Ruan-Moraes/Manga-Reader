package com.mangareader.mock.store;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.entity.StoreTitle;
import com.mangareader.domain.store.valueobject.StoreAvailability;
import com.mangareader.mock.title.TitleMock;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class StoreMock {

    private StoreMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final UUID STORE_1_ID = UUID.fromString("50000000-0000-0000-0000-000000000001");
    public static final UUID STORE_2_ID = UUID.fromString("50000000-0000-0000-0000-000000000002");
    public static final UUID STORE_3_ID = UUID.fromString("50000000-0000-0000-0000-000000000003");

    // ── Store titles ───────────────────────────────────────────────────────

    public static StoreTitle storeTitle(Store store, String titleId, String url) {
        return StoreTitle.builder()
                .id(UUID.randomUUID())
                .store(store)
                .titleId(titleId)
                .url(url)
                .build();
    }

    // ── Stores ─────────────────────────────────────────────────────────────

    public static Store amazonStore() {
        Store store = Store.builder()
                .id(STORE_1_ID)
                .name("Amazon")
                .logo("https://picsum.photos/200/60?random=s1")
                .icon("https://picsum.photos/50/50?random=s1i")
                .description("Maior loja online do mundo com vasto catalogo de mangas.")
                .website("https://amazon.com.br")
                .availability(StoreAvailability.IN_STOCK)
                .rating(4.5)
                .features(new ArrayList<>(List.of("Frete gratis Prime", "Kindle", "Pre-venda")))
                .titles(new ArrayList<>())
                .build();

        store.getTitles().add(storeTitle(store, TitleMock.TITLE_1_ID, "https://amazon.com.br/reino-de-aco"));
        store.getTitles().add(storeTitle(store, TitleMock.TITLE_4_ID, "https://amazon.com.br/cronicas-de-polaris"));
        store.getTitles().add(storeTitle(store, TitleMock.TITLE_8_ID, "https://amazon.com.br/protocolo-zero"));

        return store;
    }

    public static Store paniniStore() {
        Store store = Store.builder()
                .id(STORE_2_ID)
                .name("Panini")
                .logo("https://picsum.photos/200/60?random=s2")
                .icon("https://picsum.photos/50/50?random=s2i")
                .description("Editora oficial de diversos mangas no Brasil.")
                .website("https://loja.panini.com.br")
                .availability(StoreAvailability.IN_STOCK)
                .rating(4.2)
                .features(new ArrayList<>(List.of("Edicoes exclusivas", "Assinatura mensal", "Clube de desconto")))
                .titles(new ArrayList<>())
                .build();

        store.getTitles().add(storeTitle(store, TitleMock.TITLE_1_ID, "https://panini.com.br/reino-de-aco"));
        store.getTitles().add(storeTitle(store, TitleMock.TITLE_5_ID, "https://panini.com.br/vento-cortante"));

        return store;
    }

    public static Store preOrderStore() {
        Store store = Store.builder()
                .id(STORE_3_ID)
                .name("Manga Import")
                .logo("https://picsum.photos/200/60?random=s3")
                .description("Loja especializada em importacao de mangas japoneses.")
                .website("https://mangaimport.com.br")
                .availability(StoreAvailability.PRE_ORDER)
                .rating(3.8)
                .features(new ArrayList<>(List.of("Importacao direta", "Edicoes japonesas")))
                .titles(new ArrayList<>())
                .build();

        store.getTitles().add(storeTitle(store, TitleMock.TITLE_4_ID, "https://mangaimport.com.br/polaris-jp"));

        return store;
    }

    public static Store outOfStockStore() {
        return Store.builder()
                .id(UUID.randomUUID())
                .name("Loja Fechada")
                .description("Temporariamente sem estoque.")
                .website("https://lojafechada.com.br")
                .availability(StoreAvailability.OUT_OF_STOCK)
                .rating(2.0)
                .features(new ArrayList<>())
                .titles(new ArrayList<>())
                .build();
    }

    public static Store emptyStore() {
        return Store.builder()
                .id(UUID.randomUUID())
                .name("Nova Loja")
                .website("https://novaloja.com.br")
                .availability(StoreAvailability.IN_STOCK)
                .features(new ArrayList<>())
                .titles(new ArrayList<>())
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<Store> allStores() {
        return List.of(amazonStore(), paniniStore(), preOrderStore());
    }

    public static List<Store> inStock() {
        return List.of(amazonStore(), paniniStore());
    }
}
