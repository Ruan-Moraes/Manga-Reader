package com.mangareader.presentation.admin.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.application.news.usecase.admin.CreateNewsUseCase;
import com.mangareader.application.news.usecase.admin.DeleteNewsUseCase;
import com.mangareader.application.news.usecase.admin.UpdateNewsUseCase;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;

@WebMvcTest(AdminNewsController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminNewsController")
class AdminNewsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private NewsRepositoryPort newsRepository;

    @MockitoBean
    private CreateNewsUseCase createNewsUseCase;

    @MockitoBean
    private UpdateNewsUseCase updateNewsUseCase;

    @MockitoBean
    private DeleteNewsUseCase deleteNewsUseCase;

    private NewsItem buildNews() {
        return NewsItem.builder()
                .id("news-1")
                .title("Breaking News")
                .subtitle("Subtitle")
                .excerpt("Excerpt")
                .coverImage("cover.jpg")
                .category(NewsCategory.PRINCIPAIS)
                .tags(List.of("manga"))
                .author(NewsAuthor.builder().name("Editor").build())
                .source("source.com")
                .readTime(5)
                .views(100)
                .isExclusive(false)
                .isFeatured(true)
                .publishedAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .updatedAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();
    }

    @Test
    @DisplayName("GET /api/admin/news — deve retornar 200 com lista paginada")
    void deveRetornar200ComListaPaginada() throws Exception {
        var page = new PageImpl<>(List.of(buildNews()));
        when(newsRepository.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/admin/news"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Breaking News"));
    }

    @Test
    @DisplayName("GET /api/admin/news/{id} — deve retornar 200 com detalhes")
    void deveRetornar200ComDetalhes() throws Exception {
        when(newsRepository.findById("news-1")).thenReturn(Optional.of(buildNews()));

        mockMvc.perform(get("/api/admin/news/news-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Breaking News"))
                .andExpect(jsonPath("$.data.category").value("PRINCIPAIS"));
    }

    @Test
    @DisplayName("POST /api/admin/news — deve retornar 201 ao criar notícia")
    void deveRetornar201AoCriarNoticia() throws Exception {
        when(createNewsUseCase.execute(
                anyString(), any(), any(), any(), any(), any(NewsCategory.class),
                any(), any(NewsAuthor.class), any(), anyInt(), anyBoolean(), anyBoolean()
        )).thenReturn(buildNews());

        mockMvc.perform(post("/api/admin/news")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "title": "Breaking News",
                                    "category": "PRINCIPAIS",
                                    "readTime": 5,
                                    "isExclusive": false,
                                    "isFeatured": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Breaking News"));
    }

    @Test
    @DisplayName("PATCH /api/admin/news/{id} — deve retornar 200 ao atualizar")
    void deveRetornar200AoAtualizar() throws Exception {
        NewsItem updated = buildNews();
        updated.setTitle("Updated News");
        when(updateNewsUseCase.execute(
                eq("news-1"), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()
        )).thenReturn(updated);

        mockMvc.perform(patch("/api/admin/news/news-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Updated News"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Updated News"));
    }

    @Test
    @DisplayName("DELETE /api/admin/news/{id} — deve retornar 204")
    void deveRetornar204AoExcluir() throws Exception {
        mockMvc.perform(delete("/api/admin/news/news-1"))
                .andExpect(status().isNoContent());
    }
}
