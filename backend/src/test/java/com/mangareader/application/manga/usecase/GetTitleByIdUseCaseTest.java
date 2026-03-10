package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetTitleByIdUseCase")
class GetTitleByIdUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private GetTitleByIdUseCase getTitleByIdUseCase;

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve retornar título quando ID existe")
        void deveRetornarTituloQuandoIdExiste() {
            // Arrange
            Title title = Title.builder()
                    .id("abc123")
                    .name("Naruto")
                    .author("Masashi Kishimoto")
                    .build();

            when(titleRepository.findById("abc123")).thenReturn(Optional.of(title));

            // Act
            Title result = getTitleByIdUseCase.execute("abc123");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo("abc123");
            assertThat(result.getName()).isEqualTo("Naruto");
            assertThat(result.getAuthor()).isEqualTo("Masashi Kishimoto");
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando título não existe")
        void deveLancarExcecaoQuandoTituloNaoExiste() {
            // Arrange
            when(titleRepository.findById("inexistente")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> getTitleByIdUseCase.execute("inexistente"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Title")
                    .hasMessageContaining("id");
        }
    }
}
