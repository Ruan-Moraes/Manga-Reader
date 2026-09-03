package com.mangareader.presentation.forum.controller;

import com.mangareader.shared.web.PageableWebConfig;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
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

import org.junit.jupiter.api.BeforeEach;
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

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.forum.port.ForumTopicVoteRepositoryPort;
import com.mangareader.application.forum.usecase.CastForumTopicVoteUseCase;
import com.mangareader.application.forum.usecase.CreateForumReplyUseCase;
import com.mangareader.application.forum.usecase.CreateForumTopicUseCase;
import com.mangareader.application.forum.usecase.DeleteForumTopicUseCase;
import com.mangareader.application.forum.usecase.GetAuthorPostCountUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicByIdUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicByIdUseCase.ForumTopicDetail;
import com.mangareader.application.forum.usecase.GetForumTopicsByCategoryUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicsUseCase;
import com.mangareader.application.forum.usecase.RemoveForumTopicVoteUseCase;
import com.mangareader.application.forum.usecase.UpdateForumTopicUseCase;
import com.mangareader.application.label.service.DomainLabelService;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.presentation.forum.mapper.ForumMapper;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.exception.ResourceNotFoundException;

import org.springframework.context.annotation.Import;

@WebMvcTest(ForumController.class)
@Import({ForumMapper.class, PageableWebConfig.class})
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ForumController")
class ForumControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DomainLabelService domainLabelService;

    @MockitoBean
    private UserRepositoryPort userRepository;

    @MockitoBean
    private ForumTopicVoteRepositoryPort topicVoteRepository;

    @MockitoBean
    private GetForumTopicsUseCase getForumTopicsUseCase;

    @MockitoBean
    private GetForumTopicByIdUseCase getForumTopicByIdUseCase;

    @MockitoBean
    private GetForumTopicsByCategoryUseCase getForumTopicsByCategoryUseCase;

    @MockitoBean
    private GetAuthorPostCountUseCase getAuthorPostCountUseCase;

    @MockitoBean
    private CreateForumTopicUseCase createForumTopicUseCase;

    @MockitoBean
    private CreateForumReplyUseCase createForumReplyUseCase;

    @MockitoBean
    private UpdateForumTopicUseCase updateForumTopicUseCase;

    @MockitoBean
    private DeleteForumTopicUseCase deleteForumTopicUseCase;

    @MockitoBean
    private CastForumTopicVoteUseCase castForumTopicVoteUseCase;

    @MockitoBean
    private RemoveForumTopicVoteUseCase removeForumTopicVoteUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    private final UUID USER_ID = UUID.randomUUID();

    @BeforeEach
    void stubMapperDependencies() {
        lenient().when(domainLabelService.resolveLabel(any(), any(), any()))
                .thenAnswer(inv -> inv.getArgument(2));
        lenient().when(userRepository.findAllById(anyCollection())).thenReturn(List.of());
        lenient().when(getAuthorPostCountUseCase.execute(anyString())).thenReturn(3L);
        lenient().when(topicVoteRepository.findByTopicIdInAndUserId(anyCollection(), anyString()))
                .thenReturn(List.of());
    }

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(USER_ID);
        return auth;
    }

    private ForumTopic buildTopic(String id) {
        return ForumTopic.builder()
                .id(id)
                .authorId(USER_ID.toString())
                .authorName("Ruan")
                .title("Tópico Teste")
                .content("Conteúdo do tópico")
                .category(ForumCategory.GERAL)
                .tags(List.of("manga", "discussão"))
                .viewCount(10)
                .replyCount(2)
                .upvotes(5)
                .downvotes(1)
                .createdAt(LocalDateTime.of(2026, 3, 10, 14, 0))
                .lastActivityAt(LocalDateTime.of(2026, 3, 10, 15, 0))
                .build();
    }

    private ForumTopicDetail buildDetail(String id) {
        Comment reply = Comment.builder()
                .id("reply-1")
                .targetType(CommentTarget.FORUM_TOPIC)
                .targetId(id)
                .userId(USER_ID.toString())
                .userName("Ruan")
                .textContent("Primeira resposta")
                .upvotes(4)
                .isHighlighted(true)
                .build();

        return new ForumTopicDetail(buildTopic(id), List.of(reply));
    }

    @Nested
    @DisplayName("GET /api/forum")
    class GetAll {

        @Test
        @DisplayName("Deve retornar 200 com tópicos paginados e votos padronizados")
        void deveRetornar200ComTopicos() throws Exception {
            var topics = List.of(buildTopic("t1"), buildTopic("t2"));
            when(getForumTopicsUseCase.execute(any(Pageable.class), org.mockito.ArgumentMatchers.anyBoolean()))
                    .thenReturn(new PageImpl<>(topics));

            mockMvc.perform(get("/api/forum"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].title").value("Tópico Teste"))
                    .andExpect(jsonPath("$.data.content[0].upvotes").value(5))
                    .andExpect(jsonPath("$.data.content[0].downvotes").value(1))
                    .andExpect(jsonPath("$.data.content[0].author.name").value("Ruan"));
        }

        @Test
        @DisplayName("Deve retornar página vazia")
        void deveRetornarPaginaVazia() throws Exception {
            when(getForumTopicsUseCase.execute(any(Pageable.class), org.mockito.ArgumentMatchers.anyBoolean()))
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
        @DisplayName("Deve retornar 200 com tópico e replies (comments unificados)")
        void deveRetornar200() throws Exception {
            when(getForumTopicByIdUseCase.execute("t1")).thenReturn(buildDetail("t1"));

            mockMvc.perform(get("/api/forum/t1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("Tópico Teste"))
                    .andExpect(jsonPath("$.data.category").value("Geral"))
                    .andExpect(jsonPath("$.data.replies.length()").value(1))
                    .andExpect(jsonPath("$.data.replies[0].content").value("Primeira resposta"))
                    .andExpect(jsonPath("$.data.replies[0].upvotes").value(4))
                    .andExpect(jsonPath("$.data.replies[0].isBestAnswer").value(true));
        }

        @Test
        @DisplayName("Deve retornar 404 quando tópico não encontrado")
        void deveRetornar404() throws Exception {
            when(getForumTopicByIdUseCase.execute("t-x"))
                    .thenThrow(new ResourceNotFoundException("ForumTopic", "id", "t-x"));

            mockMvc.perform(get("/api/forum/t-x"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/forum/category/{category}")
    class GetByCategory {

        @Test
        @DisplayName("Deve retornar 200 com tópicos da categoria")
        void deveRetornar200() throws Exception {
            var topics = List.of(buildTopic("t1"));
            when(getForumTopicsByCategoryUseCase.execute(eq(ForumCategory.GERAL), any(Pageable.class), org.mockito.ArgumentMatchers.anyBoolean()))
                    .thenReturn(new PageImpl<>(topics));

            mockMvc.perform(get("/api/forum/category/Geral"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }

        @Test
        @DisplayName("Deve retornar 200 com página vazia para categoria sem tópicos")
        void deveRetornarPaginaVazia() throws Exception {
            when(getForumTopicsByCategoryUseCase.execute(eq(ForumCategory.SPOILERS), any(Pageable.class), org.mockito.ArgumentMatchers.anyBoolean()))
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
            var topic = buildTopic("t-new");
            when(createForumTopicUseCase.execute(any())).thenReturn(topic);
            when(getForumTopicByIdUseCase.execute("t-new")).thenReturn(new ForumTopicDetail(topic, List.of()));

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
            var topic = buildTopic("t1");
            when(createForumReplyUseCase.execute(any())).thenReturn(topic);
            when(getForumTopicByIdUseCase.execute("t1")).thenReturn(buildDetail("t1"));

            mockMvc.perform(post("/api/forum/t1/replies")
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
            mockMvc.perform(post("/api/forum/t1/replies")
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
            var topic = buildTopic("t1");
            when(updateForumTopicUseCase.execute(any())).thenReturn(topic);
            when(getForumTopicByIdUseCase.execute("t1")).thenReturn(new ForumTopicDetail(topic, List.of()));

            mockMvc.perform(put("/api/forum/t1")
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
            when(updateForumTopicUseCase.execute(any()))
                    .thenThrow(new ResourceNotFoundException("ForumTopic", "id", "t-x"));

            mockMvc.perform(put("/api/forum/t-x")
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
            mockMvc.perform(delete("/api/forum/t1")
                            .principal(mockAuth()))
                    .andExpect(status().isNoContent());

            verify(deleteForumTopicUseCase).execute("t1", USER_ID);
        }
    }

    @Nested
    @DisplayName("POST /api/forum/{id}/vote")
    class Vote {

        @Test
        @DisplayName("Deve retornar 200 com contadores e myVote ao votar 'up'")
        void deveRetornar200AoVotar() throws Exception {
            when(castForumTopicVoteUseCase.execute(eq("t1"), eq(USER_ID.toString()), eq(VoteValue.UP)))
                    .thenReturn(new VoteResult(6, 1, VoteValue.UP));

            mockMvc.perform(post("/api/forum/t1/vote")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"value": "up"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.upvotes").value(6))
                    .andExpect(jsonPath("$.data.myVote").value("up"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando value é inválido")
        void deveRetornar400ValueInvalido() throws Exception {
            mockMvc.perform(post("/api/forum/t1/vote")
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
            when(removeForumTopicVoteUseCase.execute("t1", USER_ID.toString()))
                    .thenReturn(new VoteResult(5, 1, null));

            mockMvc.perform(delete("/api/forum/t1/vote").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.upvotes").value(5))
                    .andExpect(jsonPath("$.data.myVote").doesNotExist());
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
