package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
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
            when(titleRepository.findByFilters(isNull(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, null, PAGEABLE);

            assertThat(result.getContent()).hasSize(3);
            verify(titleRepository).findByFilters(isNull(), isNull(), isNull());
        }

        @Test
        @DisplayName("Deve buscar todos quando lista de gêneros é vazia")
        void deveBuscarTodosQuandoListaVazia() {
            when(titleRepository.findByFilters(any(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Page<Title> result = filterTitlesUseCase.execute(List.of(), null, null, null, PAGEABLE);

            assertThat(result.getContent()).hasSize(3);
        }

        @Test
        @DisplayName("Deve filtrar por múltiplos gêneros")
        void deveFiltrarPorMultiplosGeneros() {
            List<String> genres = List.of("Ação", "Aventura");
            List<Title> filtered = List.of(Title.builder().id("1").name("Naruto").build());

            when(titleRepository.findByFilters(genres, null, null)).thenReturn(filtered);

            Page<Title> result = filterTitlesUseCase.execute(genres, null, null, null, PAGEABLE);

            assertThat(result.getContent()).hasSize(1);
            verify(titleRepository).findByFilters(genres, null, null);
        }
    }

    @Nested
    @DisplayName("Filtro por status")
    class FiltroPorStatus {
        @Test
        @DisplayName("Deve filtrar por status ONGOING")
        void deveFiltrarPorStatusOngoing() {
            List<Title> filtered = List.of(
                    Title.builder().id("1").name("Naruto").status("ONGOING").build()
            );
            when(titleRepository.findByFilters(isNull(), any(), isNull())).thenReturn(filtered);

            Page<Title> result = filterTitlesUseCase.execute(null, "ONGOING", null, null, PAGEABLE);

            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Filtro por conteúdo adulto")
    class FiltroPorAdult {
        @Test
        @DisplayName("Deve filtrar somente adulto quando adult=true")
        void deveFiltrarSomenteAdulto() {
            List<Title> filtered = List.of(
                    Title.builder().id("1").name("Titulo Adulto").adult(true).build()
            );
            when(titleRepository.findByFilters(isNull(), isNull(), any())).thenReturn(filtered);

            Page<Title> result = filterTitlesUseCase.execute(null, null, true, null, PAGEABLE);

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Deve excluir adulto quando adult=false")
        void deveExcluirAdulto() {
            List<Title> filtered = List.of(
                    Title.builder().id("1").name("Titulo Normal").adult(false).build()
            );
            when(titleRepository.findByFilters(isNull(), isNull(), any())).thenReturn(filtered);

            Page<Title> result = filterTitlesUseCase.execute(null, null, false, null, PAGEABLE);

            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Filtros combinados")
    class FiltrosCombinados {
        @Test
        @DisplayName("Deve combinar gêneros, status e adult")
        void deveCombinarFiltros() {
            List<String> genres = List.of("Ação");
            List<Title> filtered = List.of(
                    Title.builder().id("1").name("Naruto").status("ONGOING").adult(false).build()
            );
            when(titleRepository.findByFilters(genres, "ONGOING", false)).thenReturn(filtered);

            Page<Title> result = filterTitlesUseCase.execute(genres, "ONGOING", false, SortCriteria.MOST_READ, PAGEABLE);

            assertThat(result.getContent()).hasSize(1);
            verify(titleRepository).findByFilters(genres, "ONGOING", false);
        }
    }

    @Nested
    @DisplayName("Ordenação")
    class Ordenacao {
        @Test
        @DisplayName("MOST_READ deve ordenar por popularidade decrescente")
        void mostReadDeveOrdenarPorPopularidadeDecrescente() {
            when(titleRepository.findByFilters(isNull(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, SortCriteria.MOST_READ, PAGEABLE);

            List<Title> content = result.getContent();
            assertThat(content.get(0).getName()).isEqualTo("Attack on Titan");
            assertThat(content.get(1).getName()).isEqualTo("Naruto");
            assertThat(content.get(2).getName()).isEqualTo("Bleach");
        }

        @Test
        @DisplayName("MOST_RATED deve ordenar por ratingAverage decrescente")
        void mostRatedDeveOrdenarPorScoreDecrescente() {
            when(titleRepository.findByFilters(isNull(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, SortCriteria.MOST_RATED, PAGEABLE);

            List<Title> content = result.getContent();
            assertThat(content.get(0).getName()).isEqualTo("Attack on Titan");
            assertThat(content.get(1).getName()).isEqualTo("Naruto");
            assertThat(content.get(2).getName()).isEqualTo("Bleach");
        }

        @Test
        @DisplayName("MOST_RECENT deve ordenar por data de criação decrescente")
        void mostRecentDeveOrdenarPorDataDecrescente() {
            when(titleRepository.findByFilters(isNull(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, SortCriteria.MOST_RECENT, PAGEABLE);

            List<Title> content = result.getContent();
            assertThat(content.get(0).getName()).isEqualTo("Bleach");
            assertThat(content.get(1).getName()).isEqualTo("Attack on Titan");
            assertThat(content.get(2).getName()).isEqualTo("Naruto");
        }

        @Test
        @DisplayName("ALPHABETICAL deve ordenar por nome (case-insensitive)")
        void alphabeticalDeveOrdenarPorNome() {
            when(titleRepository.findByFilters(isNull(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, SortCriteria.ALPHABETICAL, PAGEABLE);

            List<Title> content = result.getContent();
            assertThat(content.get(0).getName()).isEqualTo("Attack on Titan");
            assertThat(content.get(1).getName()).isEqualTo("Bleach");
            assertThat(content.get(2).getName()).isEqualTo("Naruto");
        }

        @Test
        @DisplayName("ASCENSION deve ordenar por popularidade crescente")
        void ascensionDeveOrdenarPorPopularidadeCrescente() {
            when(titleRepository.findByFilters(isNull(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, SortCriteria.ASCENSION, PAGEABLE);

            List<Title> content = result.getContent();
            assertThat(content.get(0).getName()).isEqualTo("Bleach");
            assertThat(content.get(1).getName()).isEqualTo("Naruto");
            assertThat(content.get(2).getName()).isEqualTo("Attack on Titan");
        }

        @Test
        @DisplayName("RANDOM deve retornar todos os títulos (ordem indeterminada)")
        void randomDeveRetornarTodosOsTitulos() {
            when(titleRepository.findByFilters(isNull(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, SortCriteria.RANDOM, PAGEABLE);

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
            when(titleRepository.findByFilters(isNull(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Pageable secondPage = PageRequest.of(1, 2);

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, null, secondPage);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(3);
            assertThat(result.getTotalPages()).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve retornar página vazia quando offset excede total")
        void deveRetornarPaginaVaziaQuandoOffsetExcede() {
            when(titleRepository.findByFilters(isNull(), isNull(), isNull()))
                    .thenReturn(buildSampleTitles());

            Pageable farPage = PageRequest.of(10, 10);

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, null, farPage);

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
            List<Title> titles = List.of(
                    Title.builder().id("1").name("Com popularidade").popularity("1000").build(),
                    Title.builder().id("2").name("Sem popularidade").popularity(null).build()
            );

            when(titleRepository.findByFilters(isNull(), isNull(), isNull())).thenReturn(titles);

            Page<Title> result = filterTitlesUseCase.execute(null, null, null, SortCriteria.MOST_READ, PAGEABLE);

            assertThat(result.getContent().get(0).getName()).isEqualTo("Com popularidade");
            assertThat(result.getContent().get(1).getName()).isEqualTo("Sem popularidade");
        }
    }
}
