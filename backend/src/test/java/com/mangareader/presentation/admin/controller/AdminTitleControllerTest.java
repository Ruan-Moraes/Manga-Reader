package com.mangareader.presentation.admin.controller;

import static org.mockito.ArgumentMatchers.any;
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
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.manga.usecase.admin.CreateTitleUseCase;
import com.mangareader.application.manga.usecase.admin.DeleteTitleUseCase;
import com.mangareader.application.manga.usecase.admin.UpdateTitleUseCase;
import com.mangareader.domain.manga.entity.Title;

@WebMvcTest(AdminTitleController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminTitleController")
class AdminTitleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private TitleRepositoryPort titleRepository;

    @MockitoBean
    private CreateTitleUseCase createTitleUseCase;

    @MockitoBean
    private UpdateTitleUseCase updateTitleUseCase;

    @MockitoBean
    private DeleteTitleUseCase deleteTitleUseCase;

    private Title buildTitle() {
        return Title.builder()
                .id("title-1")
                .name("Naruto")
                .type("manga")
                .cover("cover.jpg")
                .synopsis("A ninja story")
                .genres(List.of("Action", "Adventure"))
                .status("ONGOING")
                .author("Kishimoto")
                .artist("Kishimoto")
                .publisher("Shueisha")
                .adult(false)
                .ratingAverage(4.5)
                .ratingCount(100L)
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .updatedAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();
    }

    @Test
    @DisplayName("GET /api/admin/titles — deve retornar 200 com lista paginada")
    void deveRetornar200ComListaPaginada() throws Exception {
        var page = new PageImpl<>(List.of(buildTitle()));
        when(titleRepository.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/admin/titles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Naruto"))
                .andExpect(jsonPath("$.data.content[0].type").value("manga"));
    }

    @Test
    @DisplayName("GET /api/admin/titles?search=naruto — deve buscar por nome")
    void deveBuscarPorNome() throws Exception {
        var page = new PageImpl<>(List.of(buildTitle()));
        when(titleRepository.searchByName(eq("naruto"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/admin/titles").param("search", "naruto"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name").value("Naruto"));
    }

    @Test
    @DisplayName("GET /api/admin/titles/{id} — deve retornar 200 com detalhes")
    void deveRetornar200ComDetalhes() throws Exception {
        when(titleRepository.findById("title-1")).thenReturn(Optional.of(buildTitle()));

        mockMvc.perform(get("/api/admin/titles/title-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Naruto"))
                .andExpect(jsonPath("$.data.genres[0]").value("Action"));
    }

    @Test
    @DisplayName("POST /api/admin/titles — deve retornar 201 ao criar título")
    void deveRetornar201AoCriarTitulo() throws Exception {
        Title created = buildTitle();
        when(createTitleUseCase.execute(
                anyString(), anyString(), any(), any(), any(), any(), any(), any(), any(), any(boolean.class)
        )).thenReturn(created);

        mockMvc.perform(post("/api/admin/titles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Naruto",
                                    "type": "manga",
                                    "genres": ["Action"],
                                    "adult": false
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Naruto"));
    }

    @Test
    @DisplayName("PATCH /api/admin/titles/{id} — deve retornar 200 ao atualizar")
    void deveRetornar200AoAtualizar() throws Exception {
        Title updated = buildTitle();
        updated.setName("Naruto Shippuden");
        when(updateTitleUseCase.execute(
                eq("title-1"), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(updated);

        mockMvc.perform(patch("/api/admin/titles/title-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Naruto Shippuden"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Naruto Shippuden"));
    }

    @Test
    @DisplayName("DELETE /api/admin/titles/{id} — deve retornar 204")
    void deveRetornar204AoExcluir() throws Exception {
        mockMvc.perform(delete("/api/admin/titles/title-1"))
                .andExpect(status().isNoContent());
    }
}
