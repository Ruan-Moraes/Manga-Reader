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
@DisplayName("GetStoresByTitleIdUseCase")
class GetStoresByTitleIdUseCaseTest {

    @Mock
    private StoreRepositoryPort storeRepository;

    @InjectMocks
    private GetStoresByTitleIdUseCase getStoresByTitleIdUseCase;

    private static final String TITLE_ID = "507f1f77bcf86cd799439011";
    private static final Pageable PAGEABLE = PageRequest.of(0, 20);

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
        @DisplayName("Deve retornar página de stores que vendem o título")
        void deveRetornarStoresQueVendemOTitulo() {
            // Arrange
            List<Store> stores = List.of(
                    buildStore("Amazon"),
                    buildStore("Crunchyroll Store"),
                    buildStore("Book Walker")
            );
            when(storeRepository.findByTitleId(TITLE_ID, PAGEABLE))
                    .thenReturn(new PageImpl<>(stores));

            // Act
            Page<Store> result = getStoresByTitleIdUseCase.execute(TITLE_ID, PAGEABLE);

            // Assert
            assertThat(result.getContent()).hasSize(3);
            assertThat(result.getContent()).extracting(Store::getName)
                    .containsExactlyInAnyOrder("Amazon", "Crunchyroll Store", "Book Walker");
        }

        @Test
        @DisplayName("Deve retornar página vazia quando nenhuma store vende o título")
        void deveRetornarPaginaVaziaQuandoNenhumaStoreVendeOTitulo() {
            // Arrange
            when(storeRepository.findByTitleId(TITLE_ID, PAGEABLE))
                    .thenReturn(new PageImpl<>(List.of()));

            // Act
            Page<Store> result = getStoresByTitleIdUseCase.execute(TITLE_ID, PAGEABLE);

            // Assert
            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("Deve repassar o titleId e pageable ao repositório")
        void deveRepassarTitleIdEPageableAoRepositorio() {
            // Arrange
            when(storeRepository.findByTitleId(TITLE_ID, PAGEABLE))
                    .thenReturn(new PageImpl<>(List.of()));

            // Act
            getStoresByTitleIdUseCase.execute(TITLE_ID, PAGEABLE);

            // Assert
            verify(storeRepository).findByTitleId(TITLE_ID, PAGEABLE);
        }

        @Test
        @DisplayName("Deve aceitar titleId no formato ObjectId do MongoDB")
        void deveAceitarTitleIdNoFormatoObjectId() {
            // Arrange
            String objectId = "507f191e810c19729de860ea";
            when(storeRepository.findByTitleId(objectId, PAGEABLE))
                    .thenReturn(new PageImpl<>(List.of(buildStore("Amazon"))));

            // Act
            Page<Store> result = getStoresByTitleIdUseCase.execute(objectId, PAGEABLE);

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }
    }
}
