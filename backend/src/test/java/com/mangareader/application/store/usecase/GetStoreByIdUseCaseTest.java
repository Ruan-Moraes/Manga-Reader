package com.mangareader.application.store.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
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
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetStoreByIdUseCase")
class GetStoreByIdUseCaseTest {

    @Mock
    private StoreRepositoryPort storeRepository;

    @InjectMocks
    private GetStoreByIdUseCase getStoreByIdUseCase;

    private final UUID STORE_ID = UUID.randomUUID();

    private Store buildStore() {
        return Store.builder()
                .id(STORE_ID)
                .name("Crunchyroll Store")
                .website("https://store.crunchyroll.com")
                .build();
    }

    @Nested
    @DisplayName("Busca com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve retornar a store quando encontrada pelo ID")
        void deveRetornarStoreQuandoEncontrada() {
            // Arrange
            when(storeRepository.findById(STORE_ID)).thenReturn(Optional.of(buildStore()));

            // Act
            Store result = getStoreByIdUseCase.execute(STORE_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(STORE_ID);
            assertThat(result.getName()).isEqualTo("Crunchyroll Store");
        }

        @Test
        @DisplayName("Deve consultar o repositório com o ID fornecido")
        void deveConsultarRepositorioComIdFornecido() {
            // Arrange
            when(storeRepository.findById(STORE_ID)).thenReturn(Optional.of(buildStore()));

            // Act
            getStoreByIdUseCase.execute(STORE_ID);

            // Assert
            verify(storeRepository).findById(STORE_ID);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando store não existe")
        void deveLancarExcecaoQuandoStoreNaoExiste() {
            // Arrange
            when(storeRepository.findById(STORE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> getStoreByIdUseCase.execute(STORE_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Store");
        }

        @Test
        @DisplayName("Deve incluir o ID na mensagem de erro")
        void deveIncluirIdNaMensagemDeErro() {
            // Arrange
            when(storeRepository.findById(STORE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> getStoreByIdUseCase.execute(STORE_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(STORE_ID.toString());
        }
    }
}
