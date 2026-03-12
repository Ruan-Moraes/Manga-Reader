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

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetStoresByTitleIdUseCase")
class GetStoresByTitleIdUseCaseTest {

    @Mock
    private StoreRepositoryPort storeRepository;

    @InjectMocks
    private GetStoresByTitleIdUseCase getStoresByTitleIdUseCase;

    private static final String TITLE_ID = "507f1f77bcf86cd799439011";

    private Store buildStore(String name) {
        return Store.builder()
                .id(UUID.randomUUID())
                .name(name)
                .website("https://example.com")
                .build();
    }

    @Nested
    @DisplayName("Busca com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve retornar lista de stores que vendem o título")
        void deveRetornarStoresQueVendemOTitulo() {
            // Arrange
            List<Store> stores = List.of(
                    buildStore("Amazon"),
                    buildStore("Crunchyroll Store"),
                    buildStore("Book Walker")
            );
            when(storeRepository.findByTitleId(TITLE_ID)).thenReturn(stores);

            // Act
            List<Store> result = getStoresByTitleIdUseCase.execute(TITLE_ID);

            // Assert
            assertThat(result).hasSize(3);
            assertThat(result).extracting(Store::getName)
                    .containsExactlyInAnyOrder("Amazon", "Crunchyroll Store", "Book Walker");
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nenhuma store vende o título")
        void deveRetornarListaVaziaQuandoNenhumaStoreVendeOTitulo() {
            // Arrange
            when(storeRepository.findByTitleId(TITLE_ID)).thenReturn(List.of());

            // Act
            List<Store> result = getStoresByTitleIdUseCase.execute(TITLE_ID);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Deve repassar o titleId ao repositório")
        void deveRepassarTitleIdAoRepositorio() {
            // Arrange
            when(storeRepository.findByTitleId(TITLE_ID)).thenReturn(List.of());

            // Act
            getStoresByTitleIdUseCase.execute(TITLE_ID);

            // Assert
            verify(storeRepository).findByTitleId(TITLE_ID);
        }

        @Test
        @DisplayName("Deve aceitar titleId no formato ObjectId do MongoDB")
        void deveAceitarTitleIdNoFormatoObjectId() {
            // Arrange
            String objectId = "507f191e810c19729de860ea";
            when(storeRepository.findByTitleId(objectId)).thenReturn(List.of(buildStore("Amazon")));

            // Act
            List<Store> result = getStoresByTitleIdUseCase.execute(objectId);

            // Assert
            assertThat(result).hasSize(1);
        }
    }
}
