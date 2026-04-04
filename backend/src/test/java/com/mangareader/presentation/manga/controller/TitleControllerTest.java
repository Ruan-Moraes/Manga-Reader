package com.mangareader.presentation.manga.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.manga.usecase.FilterTitlesUseCase;
import com.mangareader.application.manga.usecase.GetTitleByIdUseCase;
import com.mangareader.application.manga.usecase.GetTitlesByGenreUseCase;
import com.mangareader.application.manga.usecase.GetTitlesUseCase;
import com.mangareader.application.manga.usecase.SearchTitlesUseCase;
import com.mangareader.domain.category.valueobject.SortCriteria;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(TitleController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("TitleController")
class TitleControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetTitlesUseCase getTitlesUseCase;

    @MockitoBean
    private GetTitleByIdUseCase getTitleByIdUseCase;

    @MockitoBean
    private SearchTitlesUseCase searchTitlesUseCase;

    @MockitoBean
    private GetTitlesByGenreUseCase getTitlesByGenreUseCase;

    @MockitoBean
    private FilterTitlesUseCase filterTitlesUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    private Title buildTitle(String id) {
        return Title.builder()
                .id(id)
                .name("Solo Leveling")
                .type("Manhwa")
                .cover("cover.png")
                .synopsis("Um caçador fraco se torna o mais forte")
                .genres(List.of("Ação", "Aventura"))
                .chapters(List.of(
                        Chapter.builder().number("1").title("Capítulo 1").releaseDate("2024-01-01").pages("20").build()
                ))
                .popularity("1000")
                .ratingAverage(4.5)
                .author("Chugong")
                .artist("DUBU")
                .publisher("D&C Media")
                .createdAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2026, 3, 10, 14, 0))
                .build();
    }

    @Nested
    @DisplayName("GET /api/titles")
    class GetAll {
        @Test
        @DisplayName("Deve retornar 200 com títulos paginados")

        void deveRetornar200ComTitulos() throws Exception {
            var titles = List.of(buildTitle("t1"), buildTitle("t2"));

            when(getTitlesUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(titles));

            mockMvc.perform(get("/api/titles"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].name").value("Solo Leveling"));
        }

        @Test
        @DisplayName("Deve retornar página vazia")
        void deveRetornarPaginaVazia() throws Exception {
            when(getTitlesUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/titles"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/titles/{id}")
    class GetById {
        @Test
        @DisplayName("Deve retornar 200 com título encontrado")
        void deveRetornar200() throws Exception {
            when(getTitleByIdUseCase.execute("t1")).thenReturn(buildTitle("t1"));

            mockMvc.perform(get("/api/titles/t1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Solo Leveling"))
                    .andExpect(jsonPath("$.data.author").value("Chugong"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando título não encontrado")
        void deveRetornar404() throws Exception {
            when(getTitleByIdUseCase.execute("inexistente"))
                    .thenThrow(new ResourceNotFoundException("Title", "id", "inexistente"));

            mockMvc.perform(get("/api/titles/inexistente"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/titles/search")
    class Search {
        @Test
        @DisplayName("Deve retornar 200 com resultados da busca")
        void deveRetornar200() throws Exception {
            var titles = List.of(buildTitle("t1"));
            when(searchTitlesUseCase.execute(eq("Solo"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(titles));

            mockMvc.perform(get("/api/titles/search").param("q", "Solo"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }

        @Test
        @DisplayName("Deve retornar 200 com página vazia para busca sem resultados")
        void deveRetornarPaginaVazia() throws Exception {
            when(searchTitlesUseCase.execute(eq("xyz"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/titles/search").param("q", "xyz"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/titles/genre/{genre}")
    class GetByGenre {
        @Test
        @DisplayName("Deve retornar 200 com títulos do gênero")
        void deveRetornar200() throws Exception {
            var titles = List.of(buildTitle("t1"));

            when(getTitlesByGenreUseCase.execute(eq("Ação"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(titles));

            mockMvc.perform(get("/api/titles/genre/Ação"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }

        @Test
        @DisplayName("Deve retornar 200 com página vazia para gênero sem títulos")
        void deveRetornarPaginaVazia() throws Exception {
            when(getTitlesByGenreUseCase.execute(eq("Terror"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/titles/genre/Terror"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/titles/filter")
    class Filter {
        @Test
        @DisplayName("Deve retornar 200 com filtro por gêneros")
        void deveRetornar200ComFiltro() throws Exception {
            var titles = List.of(buildTitle("t1"));

            when(filterTitlesUseCase.execute(any(), any(), any(), eq(SortCriteria.MOST_READ), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(titles));

            mockMvc.perform(get("/api/titles/filter")
                            .param("genres", "Ação", "Aventura")
                            .param("sort", "MOST_READ"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }

        @Test
        @DisplayName("Deve usar MOST_READ como fallback para sort inválido")
        void deveUsarFallbackParaSortInvalido() throws Exception {
            when(filterTitlesUseCase.execute(any(), any(), any(), eq(SortCriteria.MOST_READ), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/titles/filter").param("sort", "INVALIDO"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }

        @Test
        @DisplayName("Deve filtrar por status e adult")
        void deveFiltrarPorStatusEAdult() throws Exception {
            var titles = List.of(buildTitle("t1"));

            when(filterTitlesUseCase.execute(any(), eq("ONGOING"), eq(false), eq(SortCriteria.MOST_READ), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(titles));

            mockMvc.perform(get("/api/titles/filter")
                            .param("status", "ONGOING")
                            .param("adult", "false")
                            .param("sort", "MOST_READ"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }
    }
}
