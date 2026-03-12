package com.mangareader.presentation.news.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import com.mangareader.application.news.usecase.GetNewsByCategoryUseCase;
import com.mangareader.application.news.usecase.GetNewsByIdUseCase;
import com.mangareader.application.news.usecase.GetNewsUseCase;
import com.mangareader.application.news.usecase.SearchNewsUseCase;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.shared.exception.ResourceNotFoundException;

@WebMvcTest(NewsController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("NewsController")
class NewsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetNewsUseCase getNewsUseCase;

    @MockitoBean
    private GetNewsByIdUseCase getNewsByIdUseCase;

    @MockitoBean
    private GetNewsByCategoryUseCase getNewsByCategoryUseCase;

    @MockitoBean
    private SearchNewsUseCase searchNewsUseCase;

    private NewsItem buildNews(String id, String title) {
        return NewsItem.builder()
                .id(id)
                .title(title)
                .category(NewsCategory.LANCAMENTOS)
                .build();
    }

    @Nested
    @DisplayName("GET /api/news")
    class GetAll {

        @Test
        @DisplayName("Deve retornar 200 com notícias paginadas")
        void deveRetornar200ComNoticias() throws Exception {
            var news = List.of(
                    buildNews("1", "Novo mangá anunciado"),
                    buildNews("2", "Anime confirmado para 2026")
            );
            when(getNewsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(news));

            mockMvc.perform(get("/api/news"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].title").value("Novo mangá anunciado"));
        }

        @Test
        @DisplayName("Deve retornar página vazia quando não há notícias")
        void deveRetornarPaginaVazia() throws Exception {
            when(getNewsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/news"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/news/{id}")
    class GetById {

        @Test
        @DisplayName("Deve retornar 200 com notícia encontrada")
        void deveRetornar200() throws Exception {
            when(getNewsByIdUseCase.execute("news-1"))
                    .thenReturn(buildNews("news-1", "Novo mangá anunciado"));

            mockMvc.perform(get("/api/news/news-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("Novo mangá anunciado"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando notícia não existe")
        void deveRetornar404() throws Exception {
            when(getNewsByIdUseCase.execute("inexistente"))
                    .thenThrow(new ResourceNotFoundException("News", "id", "inexistente"));

            mockMvc.perform(get("/api/news/inexistente"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/news/category/{category}")
    class GetByCategory {

        @Test
        @DisplayName("Deve retornar 200 com notícias filtradas por categoria")
        void deveRetornar200FiltradoPorCategoria() throws Exception {
            var news = List.of(buildNews("1", "Anime de One Piece"));
            when(getNewsByCategoryUseCase.execute(eq(NewsCategory.LANCAMENTOS), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(news));

            mockMvc.perform(get("/api/news/category/LANCAMENTOS"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }

        @Test
        @DisplayName("Deve retornar 200 usando displayName da categoria")
        void deveRetornar200UsandoDisplayName() throws Exception {
            when(getNewsByCategoryUseCase.execute(eq(NewsCategory.LANCAMENTOS), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/news/category/Lançamentos"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Deve retornar 500 para categoria inválida (IllegalArgumentException sem handler específico)")
        void deveRetornar500ParaCategoriaInvalida() throws Exception {
            // IllegalArgumentException não tem handler específico no GlobalExceptionHandler,
            // por isso cai no handler genérico que retorna 500.
            mockMvc.perform(get("/api/news/category/CATEGORIA_INVALIDA"))
                    .andExpect(status().isInternalServerError());
        }

        @Test
        @DisplayName("Deve retornar página vazia para categoria sem notícias")
        void deveRetornarPaginaVazia() throws Exception {
            when(getNewsByCategoryUseCase.execute(eq(NewsCategory.INTERNACIONAL), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/news/category/INTERNACIONAL"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/news/search")
    class Search {

        @Test
        @DisplayName("Deve retornar 200 com resultados de busca")
        void deveRetornar200ComResultados() throws Exception {
            var news = List.of(buildNews("1", "Solo Leveling novo capítulo"));
            when(searchNewsUseCase.execute(eq("Solo Leveling"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(news));

            mockMvc.perform(get("/api/news/search").param("q", "Solo Leveling"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }

        @Test
        @DisplayName("Deve retornar 200 com lista vazia quando não há resultados")
        void deveRetornar200SemResultados() throws Exception {
            when(searchNewsUseCase.execute(eq("xyz_inexistente"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/news/search").param("q", "xyz_inexistente"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }
}
