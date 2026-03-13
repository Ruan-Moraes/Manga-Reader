package com.mangareader.presentation.comment.controller;

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

import com.mangareader.application.comment.usecase.CreateCommentUseCase;
import com.mangareader.application.comment.usecase.DeleteCommentUseCase;
import com.mangareader.application.comment.usecase.GetCommentsByTitleUseCase;
import com.mangareader.application.comment.usecase.ReactToCommentUseCase;
import com.mangareader.application.comment.usecase.UpdateCommentUseCase;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(CommentController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("CommentController")
class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetCommentsByTitleUseCase getCommentsByTitleUseCase;

    @MockitoBean
    private CreateCommentUseCase createCommentUseCase;

    @MockitoBean
    private UpdateCommentUseCase updateCommentUseCase;

    @MockitoBean
    private DeleteCommentUseCase deleteCommentUseCase;

    @MockitoBean
    private ReactToCommentUseCase reactToCommentUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    private final UUID USER_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(USER_ID);
        return auth;
    }

    private Comment buildComment(String id) {
        return Comment.builder()
                .id(id)
                .titleId("title-1")
                .userId(USER_ID.toString())
                .userName("Ruan")
                .textContent("Ótimo capítulo!")
                .likeCount(5)
                .dislikeCount(1)
                .createdAt(LocalDateTime.of(2026, 3, 10, 14, 0))
                .build();
    }

    @Nested
    @DisplayName("GET /api/comments/title/{titleId}")
    class GetByTitle {

        @Test
        @DisplayName("Deve retornar 200 com comentários paginados")
        void deveRetornar200ComComentarios() throws Exception {
            var comments = List.of(buildComment("c1"), buildComment("c2"));
            when(getCommentsByTitleUseCase.execute(eq("title-1"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(comments));

            mockMvc.perform(get("/api/comments/title/title-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].userName").value("Ruan"));
        }

        @Test
        @DisplayName("Deve retornar página vazia")
        void deveRetornarPaginaVazia() throws Exception {
            when(getCommentsByTitleUseCase.execute(eq("title-x"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/comments/title/title-x"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("POST /api/comments")
    class Create {

        @Test
        @DisplayName("Deve retornar 201 ao criar comentário")
        void deveRetornar201() throws Exception {
            var comment = buildComment("new-id");
            when(createCommentUseCase.execute(any())).thenReturn(comment);

            mockMvc.perform(post("/api/comments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "title-1", "textContent": "Ótimo capítulo!"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.textContent").value("Ótimo capítulo!"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando titleId está em branco")
        void deveRetornar400TitleIdEmBranco() throws Exception {
            mockMvc.perform(post("/api/comments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "", "textContent": "Comentário"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando textContent está em branco")
        void deveRetornar400TextContentEmBranco() throws Exception {
            mockMvc.perform(post("/api/comments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "title-1", "textContent": ""}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/comments/{id}")
    class Update {

        @Test
        @DisplayName("Deve retornar 200 ao atualizar comentário")
        void deveRetornar200() throws Exception {
            var updated = buildComment("c1");
            when(updateCommentUseCase.execute(any())).thenReturn(updated);

            mockMvc.perform(put("/api/comments/c1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"textContent": "Texto atualizado"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve retornar 400 quando textContent está em branco")
        void deveRetornar400TextContentEmBranco() throws Exception {
            mockMvc.perform(put("/api/comments/c1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"textContent": ""}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/comments/{id}")
    class Delete {

        @Test
        @DisplayName("Deve retornar 204 ao excluir comentário")
        void deveRetornar204() throws Exception {
            mockMvc.perform(delete("/api/comments/c1")
                            .principal(mockAuth()))
                    .andExpect(status().isNoContent());

            verify(deleteCommentUseCase).execute("c1", USER_ID);
        }
    }

    @Nested
    @DisplayName("POST /api/comments/{id}/like e /dislike")
    class Reactions {

        @Test
        @DisplayName("Deve retornar 200 ao curtir comentário")
        void deveRetornar200AoCurtir() throws Exception {
            var comment = buildComment("c1");
            when(reactToCommentUseCase.execute("c1", ReactToCommentUseCase.ReactionType.LIKE))
                    .thenReturn(comment);

            mockMvc.perform(post("/api/comments/c1/like"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve retornar 200 ao descurtir comentário")
        void deveRetornar200AoDescurtir() throws Exception {
            var comment = buildComment("c1");
            when(reactToCommentUseCase.execute("c1", ReactToCommentUseCase.ReactionType.DISLIKE))
                    .thenReturn(comment);

            mockMvc.perform(post("/api/comments/c1/dislike"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}
