package com.mangareader.presentation.store.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreAvailability;
import com.mangareader.domain.store.valueobject.StoreCategory;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;
import com.mangareader.presentation.store.dto.StoreResponse;
import com.mangareader.shared.domain.i18n.LocalizedString;

@ExtendWith(MockitoExtension.class)
@DisplayName("StoreMapper")
class StoreMapperTest {

    @Mock
    private LocalizedMappingHelper i18n;

    @InjectMocks
    private StoreMapper mapper;

    @Test
    @DisplayName("Deve mapear os campos de compra/metadados (DT-46) e baixar a categoria")
    void deveMapearCamposNovos() {
        when(i18n.toResolvedString(any(LocalizedString.class))).thenReturn("Panini");

        Store store = Store.builder()
                .id(UUID.randomUUID())
                .name(LocalizedString.ofDefault("Panini"))
                .description(LocalizedString.ofDefault("Editora oficial"))
                .website("https://panini.com.br")
                .availability(StoreAvailability.IN_STOCK)
                .rating(4.9)
                .price(4490)
                .oldPrice(4990)
                .category(StoreCategory.OFICIAL)
                .official(true)
                .ratingCount(1820)
                .format("Volume único · capa dura")
                .shipping("Frete grátis acima de R$ 99")
                .note("Edição nacional licenciada")
                .mono("P")
                .color("#e23744")
                .build();

        StoreResponse response = mapper.toResponse(store);

        assertThat(response.price()).isEqualTo(4490);
        assertThat(response.oldPrice()).isEqualTo(4990);
        assertThat(response.category()).isEqualTo("oficial");
        assertThat(response.official()).isTrue();
        assertThat(response.ratingCount()).isEqualTo(1820);
        assertThat(response.format()).isEqualTo("Volume único · capa dura");
        assertThat(response.shipping()).isEqualTo("Frete grátis acima de R$ 99");
        assertThat(response.note()).isEqualTo("Edição nacional licenciada");
        assertThat(response.mono()).isEqualTo("P");
        assertThat(response.color()).isEqualTo("#e23744");
        assertThat(response.availability()).isEqualTo("in_stock");
    }

    @Test
    @DisplayName("Deve mapear category nula como null")
    void deveMapearCategoryNula() {
        when(i18n.toResolvedString(any(LocalizedString.class))).thenReturn("Loja");

        Store store = Store.builder()
                .id(UUID.randomUUID())
                .name(LocalizedString.ofDefault("Loja"))
                .description(LocalizedString.ofDefault("desc"))
                .website("https://x.com")
                .build();

        StoreResponse response = mapper.toResponse(store);

        assertThat(response.category()).isNull();
        assertThat(response.official()).isFalse();
    }
}
