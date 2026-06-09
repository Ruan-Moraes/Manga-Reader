package com.mangareader.presentation.comment.controller;

import com.mangareader.shared.web.PageableWebConfig;

import org.springframework.context.annotation.Import;

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
import java.util.Map;
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

import com.mangareader.application.comment.usecase.CastCommentVoteUseCase;
import com.mangareader.application.comment.usecase.CreateCommentUseCase;
import com.mangareader.application.comment.usecase.DeleteCommentUseCase;
import com.mangareader.application.comment.usecase.GetCommentsByTargetUseCase;
import com.mangareader.application.comment.usecase.GetUserCommentVotesUseCase;
import com.mangareader.application.comment.usecase.RemoveCommentVoteUseCase;
import com.mangareader.application.comment.usecase.UpdateCommentUseCase;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(CommentController.class)
@Import(PageableWebConfig.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("CommentController")
class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetCommentsByTargetUseCase getCommentsByTargetUseCase;

    @MockitoBean
    private CreateCommentUseCase createCommentUseCase;

    @MockitoBean
    private UpdateCommentUseCase updateCommentUseCase;

    @MockitoBean
    private DeleteCommentUseCase deleteCommentUseCase;

    @MockitoBean
    private CastCommentVoteUseCase castCommentVoteUseCase;

    @MockitoBean
    private RemoveCommentVoteUseCase removeCommentVoteUseCase;

    @MockitoBean
    private GetUserCommentVotesUseCase getUserCommentVotesUseCase;

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
                .targetType(CommentTarget.TITLE)
                .targetId("title-1")
                .userId(USER_ID.toString())
                .userName("Ruan")
                .textContent("Ótimo capítulo!")
                .upvotes(5)
                .downvotes(1)
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
            when(getCommentsByTargetUseCase.execute(eq(CommentTarget.TITLE), eq("title-1"),
                    any(Pageable.class), org.mockito.ArgumentMatchers.anyBoolean()))
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
            when(getCommentsByTargetUseCase.execute(eq(CommentTarget.TITLE), eq("title-x"),
                    any(Pageable.class), org.mockito.ArgumentMatchers.anyBoolean()))
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
                                    {"targetType": "TITLE", "targetId": "title-1", "textContent": "Ótimo capítulo!"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.textContent").value("Ótimo capítulo!"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando targetId está em branco")
        void deveRetornar400TargetIdEmBranco() throws Exception {
            mockMvc.perform(post("/api/comments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"targetType": "TITLE", "targetId": "", "textContent": "Comentário"}
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
                                    {"targetType": "TITLE", "targetId": "title-1", "textContent": ""}
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
    @DisplayName("POST /api/comments/{id}/vote")
    class Vote {

        @Test
        @DisplayName("Deve retornar 200 com contadores e myVote ao votar 'up'")
        void deveRetornar200AoVotar() throws Exception {
            when(castCommentVoteUseCase.execute(eq("c1"), eq(USER_ID.toString()), eq(VoteValue.UP)))
                    .thenReturn(new VoteResult(6, 1, VoteValue.UP));

            mockMvc.perform(post("/api/comments/c1/vote")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"value": "up"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.upvotes").value(6))
                    .andExpect(jsonPath("$.data.myVote").value("up"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando value é inválido")
        void deveRetornar400ValueInvalido() throws Exception {
            mockMvc.perform(post("/api/comments/c1/vote")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"value": "sideways"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 200 e myVote nulo ao remover o voto")
        void deveRetornar200AoRemoverVoto() throws Exception {
            when(removeCommentVoteUseCase.execute("c1", USER_ID.toString()))
                    .thenReturn(new VoteResult(5, 1, null));

            mockMvc.perform(delete("/api/comments/c1/vote").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.upvotes").value(5))
                    .andExpect(jsonPath("$.data.myVote").doesNotExist());
        }
    }

    @Nested
    @DisplayName("GET /api/comments/user-votes")
    class UserVotes {

        @Test
        @DisplayName("Deve retornar 200 com mapa de votos")
        void deveRetornar200ComVotos() throws Exception {
            when(getUserCommentVotesUseCase.execute(List.of("c1", "c2"), USER_ID.toString()))
                    .thenReturn(Map.of("c1", VoteValue.UP, "c2", VoteValue.DOWN));

            mockMvc.perform(get("/api/comments/user-votes")
                            .param("commentIds", "c1", "c2")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.c1").value("up"))
                    .andExpect(jsonPath("$.data.c2").value("down"));
        }

        @Test
        @DisplayName("Deve retornar 200 com mapa vazio")
        void deveRetornar200ComMapaVazio() throws Exception {
            when(getUserCommentVotesUseCase.execute(List.of("c1"), USER_ID.toString()))
                    .thenReturn(Map.of());

            mockMvc.perform(get("/api/comments/user-votes")
                            .param("commentIds", "c1")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }
}
