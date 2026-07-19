package com.mangareader.presentation.admin.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
import com.mangareader.application.news.usecase.admin.CreateNewsUseCase;
import com.mangareader.application.news.usecase.admin.DeleteNewsUseCase;
import com.mangareader.application.news.usecase.admin.GetAdminNewsUseCase;
import com.mangareader.application.news.usecase.admin.ListAdminNewsUseCase;
import com.mangareader.application.news.usecase.admin.UpdateNewsUseCase;
import com.mangareader.application.news.usecase.admin.ChangeNewsStatusUseCase;
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
    private ListAdminNewsUseCase listAdminNewsUseCase;

    @MockitoBean
    private GetAdminNewsUseCase getAdminNewsUseCase;

    @MockitoBean
    private CreateNewsUseCase createNewsUseCase;

    @MockitoBean
    private UpdateNewsUseCase updateNewsUseCase;

    @MockitoBean
    private DeleteNewsUseCase deleteNewsUseCase;

    @MockitoBean
    private ChangeNewsStatusUseCase changeNewsStatusUseCase;

    private NewsItem buildNews() {
        return NewsItem.builder()
                .id("news-1")
                .title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Breaking News"))
                .subtitle(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Subtitle"))
                .excerpt(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Excerpt"))
                .coverImage("cover.jpg")
                .category(NewsCategory.PRINCIPAIS)
                .tags(List.of("manga"))
                .author(NewsAuthor.builder().name("Editor").build())
                .source("source.com")
                .readTime(5)
                .views(100)
                .isExclusive(false)
                .isFeatured(true)
                .publishedAt(LocalDateTime.of(2026, 1, 1, 0, 0).toInstant(ZoneOffset.UTC))
                .updatedAt(LocalDateTime.of(2026, 1, 1, 0, 0).toInstant(ZoneOffset.UTC))
                .build();
    }

    @Test
    @DisplayName("GET /api/admin/news — deve retornar 200 com lista paginada")
    void deveRetornar200ComListaPaginada() throws Exception {
        var page = new PageImpl<>(List.of(buildNews()));
        when(listAdminNewsUseCase.execute(org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/admin/news"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title['pt-BR']").value("Breaking News"));
    }

    @Test
    @DisplayName("GET /api/admin/news/{id} — deve retornar 200 com detalhes")
    void deveRetornar200ComDetalhes() throws Exception {
        when(getAdminNewsUseCase.execute("news-1")).thenReturn(buildNews());

        mockMvc.perform(get("/api/admin/news/news-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title['pt-BR']").value("Breaking News"))
                .andExpect(jsonPath("$.data.category").value("PRINCIPAIS"));
    }

    @Test
    @DisplayName("POST /api/admin/news — deve retornar 201 ao criar notícia")
    void deveRetornar201AoCriarNoticia() throws Exception {
        when(createNewsUseCase.execute(any(com.mangareader.application.news.usecase.admin.CreateNewsUseCase.CreateNewsCommand.class)))
                .thenReturn(buildNews());

        mockMvc.perform(post("/api/admin/news")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "title": {"pt-BR": "Breaking News"},
                                    "category": "PRINCIPAIS",
                                    "readTime": 5,
                                    "isExclusive": false,
                                    "isFeatured": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title['pt-BR']").value("Breaking News"));
    }

    @Test
    @DisplayName("PATCH /api/admin/news/{id} — deve retornar 200 ao atualizar")
    void deveRetornar200AoAtualizar() throws Exception {
        NewsItem updated = buildNews();
        updated.setTitle(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Updated News"));
        when(updateNewsUseCase.execute(any(com.mangareader.application.news.usecase.admin.UpdateNewsUseCase.UpdateNewsCommand.class)))
                .thenReturn(updated);

        mockMvc.perform(patch("/api/admin/news/news-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": {"pt-BR": "Updated News"}}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title['pt-BR']").value("Updated News"));
    }

    @Test
    @DisplayName("DELETE /api/admin/news/{id} — deve retornar 204")
    void deveRetornar204AoExcluir() throws Exception {
        mockMvc.perform(delete("/api/admin/news/news-1"))
                .andExpect(status().isNoContent());
    }
}
