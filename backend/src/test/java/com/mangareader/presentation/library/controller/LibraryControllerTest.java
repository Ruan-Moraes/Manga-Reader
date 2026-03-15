package com.mangareader.presentation.library.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.library.usecase.ChangeReadingListUseCase;
import com.mangareader.application.library.usecase.GetLibraryCountsUseCase;
import com.mangareader.application.library.usecase.GetUserLibraryByListUseCase;
import com.mangareader.application.library.usecase.GetUserLibraryUseCase;
import com.mangareader.application.library.usecase.RemoveFromLibraryUseCase;
import com.mangareader.application.library.usecase.SaveToLibraryUseCase;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(LibraryController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("LibraryController")
class LibraryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetUserLibraryUseCase getUserLibraryUseCase;

    @MockitoBean
    private GetUserLibraryByListUseCase getUserLibraryByListUseCase;

    @MockitoBean
    private GetLibraryCountsUseCase getLibraryCountsUseCase;

    @MockitoBean
    private SaveToLibraryUseCase saveToLibraryUseCase;

    @MockitoBean
    private ChangeReadingListUseCase changeReadingListUseCase;

    @MockitoBean
    private RemoveFromLibraryUseCase removeFromLibraryUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    private final UUID USER_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(USER_ID);
        return auth;
    }

    private SavedManga buildSavedManga(String titleId) {
        return SavedManga.builder()
                .id(UUID.randomUUID())
                .titleId(titleId)
                .name("Solo Leveling")
                .cover("cover.png")
                .type("Manhwa")
                .list(ReadingListType.LENDO)
                .savedAt(LocalDateTime.of(2026, 3, 10, 14, 0))
                .build();
    }

    @Nested
    @DisplayName("GET /api/library")
    class GetLibrary {

        @Test
        @DisplayName("Deve retornar 200 com biblioteca paginada")
        void deveRetornar200ComBiblioteca() throws Exception {
            var items = List.of(buildSavedManga("t1"), buildSavedManga("t2"));
            when(getUserLibraryUseCase.execute(any(UUID.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(items));

            mockMvc.perform(get("/api/library")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].name").value("Solo Leveling"));
        }

        @Test
        @DisplayName("Deve retornar página vazia")
        void deveRetornarPaginaVazia() throws Exception {
            when(getUserLibraryUseCase.execute(any(UUID.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/library")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }

        @Test
        @DisplayName("Deve filtrar por lista quando parâmetro list é informado")
        void deveFiltrarPorLista() throws Exception {
            var items = List.of(buildSavedManga("t1"));
            when(getUserLibraryByListUseCase.execute(any(UUID.class), any(ReadingListType.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(items));

            mockMvc.perform(get("/api/library")
                            .param("list", "Lendo")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }
    }

    @Nested
    @DisplayName("GET /api/library/counts")
    class GetCounts {

        @Test
        @DisplayName("Deve retornar 200 com contagens da biblioteca")
        void deveRetornar200ComContagens() throws Exception {
            when(getLibraryCountsUseCase.execute(any(UUID.class)))
                    .thenReturn(new GetLibraryCountsUseCase.LibraryCounts(5, 3, 7, 15));

            mockMvc.perform(get("/api/library/counts")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.lendo").value(5))
                    .andExpect(jsonPath("$.data.queroLer").value(3))
                    .andExpect(jsonPath("$.data.concluido").value(7))
                    .andExpect(jsonPath("$.data.total").value(15));
        }
    }

    @Nested
    @DisplayName("POST /api/library")
    class Save {

        @Test
        @DisplayName("Deve retornar 201 ao salvar na biblioteca")
        void deveRetornar201() throws Exception {
            var saved = buildSavedManga("title-1");
            when(saveToLibraryUseCase.execute(any())).thenReturn(saved);

            mockMvc.perform(post("/api/library")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "title-1", "list": "Lendo"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Solo Leveling"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando titleId está em branco")
        void deveRetornar400TitleIdEmBranco() throws Exception {
            mockMvc.perform(post("/api/library")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "", "list": "Lendo"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando list é null")
        void deveRetornar400ListNula() throws Exception {
            mockMvc.perform(post("/api/library")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "title-1"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PATCH /api/library/{titleId}")
    class ChangeList {

        @Test
        @DisplayName("Deve retornar 200 ao alterar lista")
        void deveRetornar200() throws Exception {
            var saved = buildSavedManga("title-1");
            when(changeReadingListUseCase.execute(any())).thenReturn(saved);

            mockMvc.perform(patch("/api/library/{titleId}", "title-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"list": "Concluído"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve retornar 400 quando list é null")
        void deveRetornar400ListNula() throws Exception {
            mockMvc.perform(patch("/api/library/{titleId}", "title-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/library/{titleId}")
    class Remove {

        @Test
        @DisplayName("Deve retornar 204 ao remover da biblioteca")
        void deveRetornar204() throws Exception {
            mockMvc.perform(delete("/api/library/{titleId}", "title-1")
                            .principal(mockAuth()))
                    .andExpect(status().isNoContent());

            verify(removeFromLibraryUseCase).execute(USER_ID, "title-1");
        }
    }
}
