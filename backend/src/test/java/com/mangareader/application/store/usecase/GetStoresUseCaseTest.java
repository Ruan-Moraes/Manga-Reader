package com.mangareader.application.store.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetStoresUseCase")
class GetStoresUseCaseTest {

    @Mock
    private StoreRepositoryPort storeRepository;

    @InjectMocks
    private GetStoresUseCase getStoresUseCase;

    private Store buildStore(String name) {
        return Store.builder()
                .id(UUID.randomUUID())
                .name(name)
                .website("https://example.com")
                .build();
    }

    @Nested
    @DisplayName("Listagem com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve retornar página com stores quando existem registros")
        void deveRetornarPaginaComStores() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            List<Store> stores = List.of(
                    buildStore("Amazon"),
                    buildStore("Crunchyroll Store")
            );
            Page<Store> page = new PageImpl<>(stores, pageable, stores.size());
            when(storeRepository.findAll(pageable)).thenReturn(page);

            // Act
            Page<Store> result = getStoresUseCase.execute(pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve retornar página vazia quando não há stores cadastradas")
        void deveRetornarPaginaVaziaQuandoNaoHaStores() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Store> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(storeRepository.findAll(pageable)).thenReturn(emptyPage);

            // Act
            Page<Store> result = getStoresUseCase.execute(pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }

        @Test
        @DisplayName("Deve repassar o Pageable ao repositório")
        void deveRepassarPageableAoRepositorio() {
            // Arrange
            Pageable pageable = PageRequest.of(2, 5);
            Page<Store> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(storeRepository.findAll(pageable)).thenReturn(emptyPage);

            // Act
            getStoresUseCase.execute(pageable);

            // Assert
            verify(storeRepository).findAll(pageable);
        }
    }
}
