package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;
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
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetChaptersByTitleUseCase")
class GetChaptersByTitleUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private GetChaptersByTitleUseCase getChaptersByTitleUseCase;

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve retornar lista de capítulos do título")
        void deveRetornarCapitulosDoTitulo() {
            // Arrange
            List<Chapter> chapters = List.of(
                    Chapter.builder().number("1").title("O Início").build(),
                    Chapter.builder().number("2").title("A Jornada").build(),
                    Chapter.builder().number("3").title("O Confronto").build()
            );
            Title title = Title.builder().id("abc123").name("Naruto").chapters(chapters).build();

            when(titleRepository.findById("abc123")).thenReturn(Optional.of(title));

            // Act
            List<Chapter> result = getChaptersByTitleUseCase.execute("abc123");

            // Assert
            assertThat(result).hasSize(3);
            assertThat(result.get(0).getNumber()).isEqualTo("1");
            assertThat(result.get(2).getTitle()).isEqualTo("O Confronto");
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando título não possui capítulos")
        void deveRetornarListaVaziaQuandoSemCapitulos() {
            // Arrange
            Title title = Title.builder().id("abc123").name("Novo Mangá").build();
            when(titleRepository.findById("abc123")).thenReturn(Optional.of(title));

            // Act
            List<Chapter> result = getChaptersByTitleUseCase.execute("abc123");

            // Assert
            assertThat(result).isEmpty();
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
            assertThatThrownBy(() -> getChaptersByTitleUseCase.execute("inexistente"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Title");
        }
    }
}
