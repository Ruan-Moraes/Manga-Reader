package com.mangareader.presentation.forum.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

import com.mangareader.application.forum.usecase.CreateForumReplyUseCase;
import com.mangareader.application.forum.usecase.CreateForumTopicUseCase;
import com.mangareader.application.forum.usecase.DeleteForumTopicUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicByIdUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicsByCategoryUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicsUseCase;
import com.mangareader.application.forum.usecase.UpdateForumTopicUseCase;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(ForumController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ForumController")
class ForumControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetForumTopicsUseCase getForumTopicsUseCase;

    @MockitoBean
    private GetForumTopicByIdUseCase getForumTopicByIdUseCase;

    @MockitoBean
    private GetForumTopicsByCategoryUseCase getForumTopicsByCategoryUseCase;

    @MockitoBean
    private CreateForumTopicUseCase createForumTopicUseCase;

    @MockitoBean
    private CreateForumReplyUseCase createForumReplyUseCase;

    @MockitoBean
    private UpdateForumTopicUseCase updateForumTopicUseCase;

    @MockitoBean
    private DeleteForumTopicUseCase deleteForumTopicUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    private final UUID USER_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(USER_ID);
        return auth;
    }

    private ForumTopic buildTopic(UUID id) {
        var author = User.builder().id(USER_ID).name("Ruan").build();
        return ForumTopic.builder()
                .id(id)
                .author(author)
                .title("Tópico Teste")
                .content("Conteúdo do tópico")
                .category(ForumCategory.GERAL)
                .tags(List.of("manga", "discussão"))
                .viewCount(10)
                .replyCount(2)
                .likeCount(5)
                .replies(new ArrayList<>())
                .createdAt(LocalDateTime.of(2026, 3, 10, 14, 0))
                .lastActivityAt(LocalDateTime.of(2026, 3, 10, 15, 0))
                .build();
    }

    @Nested
    @DisplayName("GET /api/forum")
    class GetAll {

        @Test
        @DisplayName("Deve retornar 200 com tópicos paginados")
        void deveRetornar200ComTopicos() throws Exception {
            var topics = List.of(buildTopic(UUID.randomUUID()), buildTopic(UUID.randomUUID()));
            when(getForumTopicsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(topics));

            mockMvc.perform(get("/api/forum"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].title").value("Tópico Teste"));
        }

        @Test
        @DisplayName("Deve retornar página vazia")
        void deveRetornarPaginaVazia() throws Exception {
            when(getForumTopicsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/forum"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/forum/{id}")
    class GetById {

        @Test
        @DisplayName("Deve retornar 200 com tópico encontrado")
        void deveRetornar200() throws Exception {
            var id = UUID.randomUUID();
            when(getForumTopicByIdUseCase.execute(id)).thenReturn(buildTopic(id));

            mockMvc.perform(get("/api/forum/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("Tópico Teste"))
                    .andExpect(jsonPath("$.data.category").value("Geral"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando tópico não encontrado")
        void deveRetornar404() throws Exception {
            var id = UUID.randomUUID();
            when(getForumTopicByIdUseCase.execute(id))
                    .thenThrow(new ResourceNotFoundException("ForumTopic", "id", id));

            mockMvc.perform(get("/api/forum/{id}", id))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/forum/category/{category}")
    class GetByCategory {

        @Test
        @DisplayName("Deve retornar 200 com tópicos da categoria")
        void deveRetornar200() throws Exception {
            var topics = List.of(buildTopic(UUID.randomUUID()));
            when(getForumTopicsByCategoryUseCase.execute(eq(ForumCategory.GERAL), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(topics));

            mockMvc.perform(get("/api/forum/category/Geral"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }

        @Test
        @DisplayName("Deve retornar 200 com página vazia para categoria sem tópicos")
        void deveRetornarPaginaVazia() throws Exception {
            when(getForumTopicsByCategoryUseCase.execute(eq(ForumCategory.SPOILERS), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/forum/category/Spoilers"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("POST /api/forum")
    class Create {

        @Test
        @DisplayName("Deve retornar 201 ao criar tópico")
        void deveRetornar201() throws Exception {
            var topic = buildTopic(UUID.randomUUID());
            when(createForumTopicUseCase.execute(any())).thenReturn(topic);

            mockMvc.perform(post("/api/forum")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"title": "Novo Tópico", "content": "Conteúdo aqui", "category": "Geral", "tags": ["tag1"]}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("Tópico Teste"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando título está em branco")
        void deveRetornar400TituloEmBranco() throws Exception {
            mockMvc.perform(post("/api/forum")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"title": "", "content": "Conteúdo", "category": "Geral"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando conteúdo está em branco")
        void deveRetornar400ConteudoEmBranco() throws Exception {
            mockMvc.perform(post("/api/forum")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"title": "Tópico", "content": "", "category": "Geral"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando categoria é null")
        void deveRetornar400CategoriaNula() throws Exception {
            mockMvc.perform(post("/api/forum")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"title": "Tópico", "content": "Conteúdo"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/forum/{id}/replies")
    class Reply {

        @Test
        @DisplayName("Deve retornar 201 ao criar reply")
        void deveRetornar201() throws Exception {
            var id = UUID.randomUUID();
            var topic = buildTopic(id);
            when(createForumReplyUseCase.execute(any())).thenReturn(topic);

            mockMvc.perform(post("/api/forum/{id}/replies", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"content": "Ótimo tópico!"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve retornar 400 quando conteúdo da reply está em branco")
        void deveRetornar400ConteudoEmBranco() throws Exception {
            var id = UUID.randomUUID();
            mockMvc.perform(post("/api/forum/{id}/replies", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"content": ""}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/forum/{id}")
    class Update {

        @Test
        @DisplayName("Deve retornar 200 ao atualizar tópico")
        void deveRetornar200() throws Exception {
            var id = UUID.randomUUID();
            var topic = buildTopic(id);
            when(updateForumTopicUseCase.execute(any())).thenReturn(topic);

            mockMvc.perform(put("/api/forum/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"title": "Título Atualizado", "content": "Novo conteúdo"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve retornar 404 quando tópico não encontrado")
        void deveRetornar404() throws Exception {
            var id = UUID.randomUUID();
            when(updateForumTopicUseCase.execute(any()))
                    .thenThrow(new ResourceNotFoundException("ForumTopic", "id", id));

            mockMvc.perform(put("/api/forum/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"title": "Título Atualizado"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/forum/{id}")
    class Delete {

        @Test
        @DisplayName("Deve retornar 204 ao excluir tópico")
        void deveRetornar204() throws Exception {
            var id = UUID.randomUUID();

            mockMvc.perform(delete("/api/forum/{id}", id)
                            .principal(mockAuth()))
                    .andExpect(status().isNoContent());

            verify(deleteForumTopicUseCase).execute(id, USER_ID);
        }
    }

    @Nested
    @DisplayName("GET /api/forum/categories")
    class GetCategories {

        @Test
        @DisplayName("Deve retornar 200 com todas as categorias do enum")
        void deveRetornar200ComCategorias() throws Exception {
            mockMvc.perform(get("/api/forum/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.length()").value(ForumCategory.values().length))
                    .andExpect(jsonPath("$.data[0].name").value("GERAL"))
                    .andExpect(jsonPath("$.data[0].displayName").value("Geral"));
        }
    }
}
