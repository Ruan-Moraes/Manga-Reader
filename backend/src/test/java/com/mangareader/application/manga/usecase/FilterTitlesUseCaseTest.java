package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.category.valueobject.SortCriteria;
import com.mangareader.domain.manga.entity.Title;

@ExtendWith(MockitoExtension.class)
@DisplayName("FilterTitlesUseCase")
class FilterTitlesUseCaseTest {
    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private FilterTitlesUseCase filterTitlesUseCase;

    private final Pageable PAGEABLE = PageRequest.of(0, 10);

    private List<Title> buildSampleTitles() {
        return List.of(
                Title.builder().id("1").name("Naruto").popularity("5000").ratingAverage(4.5)
                        .createdAt(LocalDateTime.of(2020, 1, 1, 0, 0)).build(),
                Title.builder().id("2").name("Bleach").popularity("3000").ratingAverage(3.8)
                        .createdAt(LocalDateTime.of(2022, 6, 15, 0, 0)).build(),
                Title.builder().id("3").name("Attack on Titan").popularity("8000").ratingAverage(4.8)
                        .createdAt(LocalDateTime.of(2021, 3, 10, 0, 0)).build()
        );
    }

    @Nested
    @DisplayName("Filtro por gêneros")
    class FiltroPorGeneros {
        @Test
        @DisplayName("Deve buscar todos os títulos quando nenhum gênero é informado")
        void deveBuscarTodosQuandoSemGeneros() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, null, PAGEABLE);

            // Assert
            assertThat(result.getContent()).hasSize(3);

            verify(titleRepository).findAll();
        }

        @Test
        @DisplayName("Deve buscar todos quando lista de gêneros é vazia")
        void deveBuscarTodosQuandoListaVazia() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            // Act
            Page<Title> result = filterTitlesUseCase.execute(List.of(), null, PAGEABLE);

            // Assert
            assertThat(result.getContent()).hasSize(3);
        }

        @Test
        @DisplayName("Deve filtrar por múltiplos gêneros")
        void deveFiltrarPorMultiplosGeneros() {
            // Arrange
            List<String> genres = List.of("Ação", "Aventura");

            List<Title> filtered = List.of(
                    Title.builder().id("1").name("Naruto").build()
            );

            when(titleRepository.findByGenresContainingAll(genres)).thenReturn(filtered);

            // Act
            Page<Title> result = filterTitlesUseCase.execute(genres, null, PAGEABLE);

            // Assert
            assertThat(result.getContent()).hasSize(1);

            verify(titleRepository).findByGenresContainingAll(genres);
        }
    }

    @Nested
    @DisplayName("Ordenação")
    class Ordenacao {
        @Test
        @DisplayName("MOST_READ deve ordenar por popularidade decrescente")
        void mostReadDeveOrdenarPorPopularidadeDecrescente() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, SortCriteria.MOST_READ, PAGEABLE);

            // Assert
            List<Title> content = result.getContent();

            assertThat(content.get(0).getName()).isEqualTo("Attack on Titan"); // 8000
            assertThat(content.get(1).getName()).isEqualTo("Naruto");          // 5000
            assertThat(content.get(2).getName()).isEqualTo("Bleach");          // 3000
        }

        @Test
        @DisplayName("MOST_RATED deve ordenar por ratingAverage decrescente")
        void mostRatedDeveOrdenarPorScoreDecrescente() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, SortCriteria.MOST_RATED, PAGEABLE);

            // Assert
            List<Title> content = result.getContent();

            assertThat(content.get(0).getName()).isEqualTo("Attack on Titan"); // 4.8
            assertThat(content.get(1).getName()).isEqualTo("Naruto");          // 4.5
            assertThat(content.get(2).getName()).isEqualTo("Bleach");          // 3.8
        }

        @Test
        @DisplayName("MOST_RECENT deve ordenar por data de criação decrescente")
        void mostRecentDeveOrdenarPorDataDecrescente() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, SortCriteria.MOST_RECENT, PAGEABLE);

            // Assert
            List<Title> content = result.getContent();

            assertThat(content.get(0).getName()).isEqualTo("Bleach");          // 2022
            assertThat(content.get(1).getName()).isEqualTo("Attack on Titan"); // 2021
            assertThat(content.get(2).getName()).isEqualTo("Naruto");          // 2020
        }

        @Test
        @DisplayName("ALPHABETICAL deve ordenar por nome (case-insensitive)")
        void alphabeticalDeveOrdenarPorNome() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, SortCriteria.ALPHABETICAL, PAGEABLE);

            // Assert
            List<Title> content = result.getContent();

            assertThat(content.get(0).getName()).isEqualTo("Attack on Titan");
            assertThat(content.get(1).getName()).isEqualTo("Bleach");
            assertThat(content.get(2).getName()).isEqualTo("Naruto");
        }

        @Test
        @DisplayName("ASCENSION deve ordenar por popularidade crescente")
        void ascensionDeveOrdenarPorPopularidadeCrescente() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, SortCriteria.ASCENSION, PAGEABLE);

            // Assert
            List<Title> content = result.getContent();

            assertThat(content.get(0).getName()).isEqualTo("Bleach");          // 3000
            assertThat(content.get(1).getName()).isEqualTo("Naruto");          // 5000
            assertThat(content.get(2).getName()).isEqualTo("Attack on Titan"); // 8000
        }

        @Test
        @DisplayName("RANDOM deve retornar todos os títulos (ordem indeterminada)")
        void randomDeveRetornarTodosOsTitulos() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, SortCriteria.RANDOM, PAGEABLE);

            // Assert
            assertThat(result.getContent()).hasSize(3);
            assertThat(result.getTotalElements()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("Paginação manual")
    class Paginacao {
        @Test
        @DisplayName("Deve paginar corretamente os resultados")
        void devePaginarCorretamente() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            Pageable secondPage = PageRequest.of(1, 2); // página 1, tamanho 2

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, null, secondPage);

            // Assert
            assertThat(result.getContent()).hasSize(1); // 3 itens total, página 2 tem só 1
            assertThat(result.getTotalElements()).isEqualTo(3);
            assertThat(result.getTotalPages()).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve retornar página vazia quando offset excede total")
        void deveRetornarPaginaVaziaQuandoOffsetExcede() {
            // Arrange
            when(titleRepository.findAll()).thenReturn(buildSampleTitles());

            Pageable farPage = PageRequest.of(10, 10); // offset 100 > 3 itens

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, null, farPage);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("Valores numéricos inválidos")
    class ValoresNumericos {
        @Test
        @DisplayName("Deve tratar popularidade nula como zero na ordenação")
        void deveTratarPopularidadeNulaComoZero() {
            // Arrange
            List<Title> titles = List.of(
                    Title.builder().id("1").name("Com popularidade").popularity("1000").build(),
                    Title.builder().id("2").name("Sem popularidade").popularity(null).build()
            );

            when(titleRepository.findAll()).thenReturn(titles);

            // Act
            Page<Title> result = filterTitlesUseCase.execute(null, SortCriteria.MOST_READ, PAGEABLE);

            // Assert
            assertThat(result.getContent().get(0).getName()).isEqualTo("Com popularidade");
            assertThat(result.getContent().get(1).getName()).isEqualTo("Sem popularidade");
        }
    }
}
