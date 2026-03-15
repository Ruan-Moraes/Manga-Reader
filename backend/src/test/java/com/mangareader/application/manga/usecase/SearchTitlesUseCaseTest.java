package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

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

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;

@ExtendWith(MockitoExtension.class)
@DisplayName("SearchTitlesUseCase")
class SearchTitlesUseCaseTest {
    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private SearchTitlesUseCase searchTitlesUseCase;

    private final Pageable PAGEABLE = PageRequest.of(0, 10);

    @Nested
    @DisplayName("Busca com query válida")
    class QueryValida {
        @Test
        @DisplayName("Deve buscar títulos por nome quando query é fornecida")
        void deveBuscarTitulosPorNome() {
            // Arrange
            List<Title> titles = List.of(
                    Title.builder().id("1").name("Naruto").build()
            );

            Page<Title> page = new PageImpl<>(titles, PAGEABLE, 1);

            when(titleRepository.searchByName("Naruto", PAGEABLE)).thenReturn(page);

            // Act
            Page<Title> result = searchTitlesUseCase.execute("Naruto", PAGEABLE);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().getFirst().getName()).isEqualTo("Naruto");

            verify(titleRepository).searchByName("Naruto", PAGEABLE);
        }

        @Test
        @DisplayName("Deve fazer trim na query antes de buscar")
        void deveFazerTrimNaQuery() {
            // Arrange
            Page<Title> page = new PageImpl<>(List.of(), PAGEABLE, 0);

            when(titleRepository.searchByName("Naruto", PAGEABLE)).thenReturn(page);

            // Act
            searchTitlesUseCase.execute("  Naruto  ", PAGEABLE);

            // Assert
            verify(titleRepository).searchByName("Naruto", PAGEABLE);
        }
    }

    @Nested
    @DisplayName("Busca com query nula ou vazia")
    class QueryNulaOuVazia {
        @Test
        @DisplayName("Deve retornar todos os títulos quando query é nula")
        void deveRetornarTodosQuandoQueryNula() {
            // Arrange
            Page<Title> page = new PageImpl<>(List.of(), PAGEABLE, 0);

            when(titleRepository.findAll(PAGEABLE)).thenReturn(page);

            // Act
            searchTitlesUseCase.execute(null, PAGEABLE);

            // Assert
            verify(titleRepository).findAll(PAGEABLE);
        }

        @Test
        @DisplayName("Deve retornar todos os títulos quando query é vazia")
        void deveRetornarTodosQuandoQueryVazia() {
            // Arrange
            Page<Title> page = new PageImpl<>(List.of(), PAGEABLE, 0);

            when(titleRepository.findAll(PAGEABLE)).thenReturn(page);

            // Act
            searchTitlesUseCase.execute("", PAGEABLE);

            // Assert
            verify(titleRepository).findAll(PAGEABLE);
        }

        @Test
        @DisplayName("Deve retornar todos os títulos quando query contém apenas espaços")
        void deveRetornarTodosQuandoQueryApenasEspacos() {
            // Arrange
            Page<Title> page = new PageImpl<>(List.of(), PAGEABLE, 0);

            when(titleRepository.findAll(PAGEABLE)).thenReturn(page);

            // Act
            searchTitlesUseCase.execute("   ", PAGEABLE);

            // Assert
            verify(titleRepository).findAll(PAGEABLE);
        }
    }
}
