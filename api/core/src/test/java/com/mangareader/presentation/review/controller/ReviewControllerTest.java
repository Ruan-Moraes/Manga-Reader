package com.mangareader.presentation.review.controller;

import com.mangareader.shared.web.PageableWebConfig;

import org.springframework.context.annotation.Import;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import com.mangareader.application.review.port.ReviewRepositoryPort.ReviewDistribution;
import com.mangareader.application.review.port.ReviewVoteRepositoryPort;
import com.mangareader.application.review.usecase.CastReviewVoteUseCase;
import com.mangareader.application.review.usecase.DeleteReviewUseCase;
import com.mangareader.application.review.usecase.GetReviewAverageUseCase;
import com.mangareader.application.review.usecase.GetReviewDistributionUseCase;
import com.mangareader.application.review.usecase.GetReviewsByTitleUseCase;
import com.mangareader.application.review.usecase.GetUserReviewsEnrichedUseCase;
import com.mangareader.application.review.usecase.GetUserReviewsEnrichedUseCase.EnrichedReview;
import com.mangareader.application.review.usecase.GetUserReviewsUseCase;
import com.mangareader.application.review.usecase.RemoveReviewVoteUseCase;
import com.mangareader.application.review.usecase.SubmitReviewUseCase;
import com.mangareader.application.review.usecase.UpdateReviewUseCase;
import com.mangareader.domain.review.entity.Review;
import com.mangareader.presentation.manga.mapper.TitleMapper;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(ReviewController.class)
@Import(PageableWebConfig.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ReviewController")
class ReviewControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetReviewsByTitleUseCase getRatingsByTitleUseCase;

    @MockitoBean
    private GetReviewAverageUseCase getRatingAverageUseCase;

    @MockitoBean
    private GetReviewDistributionUseCase getRatingDistributionUseCase;

    @MockitoBean
    private SubmitReviewUseCase submitRatingUseCase;

    @MockitoBean
    private UpdateReviewUseCase updateRatingUseCase;

    @MockitoBean
    private DeleteReviewUseCase deleteRatingUseCase;

    @MockitoBean
    private GetUserReviewsUseCase getUserRatingsUseCase;

    @MockitoBean
    private GetUserReviewsEnrichedUseCase getUserReviewsEnrichedUseCase;

    @MockitoBean
    private TitleMapper titleMapper;

    @MockitoBean
    private CastReviewVoteUseCase castReviewVoteUseCase;

    @MockitoBean
    private RemoveReviewVoteUseCase removeReviewVoteUseCase;

    @MockitoBean
    private ReviewVoteRepositoryPort reviewVoteRepository;

    @MockitoBean
    private TokenPort tokenPort;

    private final UUID USER_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(USER_ID);
        return auth;
    }

    private Review buildRating(String id) {
        return Review.builder()
                .id(id)
                .titleId("title-1")
                .titleName("Solo Leveling")
                .userId(USER_ID.toString())
                .userName("ruan")
                .funRating(4.5)
                .artRating(5.0)
                .storylineRating(4.0)
                .charactersRating(4.5)
                .originalityRating(3.5)
                .pacingRating(4.0)
                .overallRating(4.3)
                .textContent("Ótimo mangá!")
                .build();
    }

    @Nested
    @DisplayName("GET /api/reviews/title/{titleId}")
    class GetByTitle {
        @Test
        @DisplayName("Deve retornar 200 com avaliações paginadas do título")
        void deveRetornar200ComAvaliacoes() throws Exception {
            var ratings = List.of(buildRating("r1"), buildRating("r2"));

            when(getRatingsByTitleUseCase.execute(any(), any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(ratings));

            mockMvc.perform(get("/api/reviews/title/title-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].overallRating").value(4.3))
                    .andExpect(jsonPath("$.data.content[0].titleName").value("Solo Leveling"));
        }

        @Test
        @DisplayName("Deve retornar página vazia quando título não tem avaliações")
        void deveRetornarPaginaVazia() throws Exception {
            when(getRatingsByTitleUseCase.execute(any(), any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/reviews/title/title-sem-avaliacao"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }

        @Test
        @DisplayName("Deve repassar o filtro ?star=5 ao use case")
        void deveRepassarFiltroStar() throws Exception {
            when(getRatingsByTitleUseCase.execute(any(), any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(buildRating("r1"))));

            mockMvc.perform(get("/api/reviews/title/title-1").param("star", "5"))
                    .andExpect(status().isOk());

            verify(getRatingsByTitleUseCase).execute(org.mockito.ArgumentMatchers.eq("title-1"),
                    org.mockito.ArgumentMatchers.eq(5), any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("GET /api/reviews/title/{titleId}/average")
    class GetAverage {
        @Test
        @DisplayName("Deve retornar 200 com média e contagem de avaliações")
        void deveRetornar200ComMedia() throws Exception {
            when(getRatingAverageUseCase.execute("title-1"))
                    .thenReturn(new GetReviewAverageUseCase.ReviewAverage(4.2, 150L));

            mockMvc.perform(get("/api/reviews/title/title-1/average"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.average").value(4.2))
                    .andExpect(jsonPath("$.data.count").value(150));
        }
    }

    @Nested
    @DisplayName("GET /api/reviews/title/{titleId}/distribution")
    class GetDistribution {
        @Test
        @DisplayName("Deve retornar 200 com a contagem por estrela e o total")
        void deveRetornar200ComDistribuicao() throws Exception {
            when(getRatingDistributionUseCase.execute("title-1"))
                    .thenReturn(new ReviewDistribution(2, 1, 5, 20, 72));

            mockMvc.perform(get("/api/reviews/title/title-1/distribution"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.star1").value(2))
                    .andExpect(jsonPath("$.data.star5").value(72))
                    .andExpect(jsonPath("$.data.total").value(100));
        }

        @Test
        @DisplayName("Deve retornar todos zero quando título não tem avaliações")
        void deveRetornarZeros() throws Exception {
            when(getRatingDistributionUseCase.execute("title-vazio"))
                    .thenReturn(ReviewDistribution.empty());

            mockMvc.perform(get("/api/reviews/title/title-vazio/distribution"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.total").value(0));
        }
    }

    @Nested
    @DisplayName("GET /api/reviews/user")
    class GetUserRatings {
        @Test
        @DisplayName("Deve retornar 200 com avaliações do usuário autenticado")
        void deveRetornar200ComAvaliacoesDoUsuario() throws Exception {
            var enriched = List.of(new EnrichedReview(
                    buildRating("r1"), "cover.jpg", List.of("action"), 12L, null));
            when(getUserReviewsEnrichedUseCase.execute(any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(enriched));

            mockMvc.perform(get("/api/reviews/user").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }
    }

    @Nested
    @DisplayName("GET /api/reviews/user/{userId}")
    class GetByUser {
        @Test
        @DisplayName("Deve retornar 200 com avaliações públicas de um usuário")
        void deveRetornar200ComResenhasDoUsuario() throws Exception {
            var ratings = List.of(buildRating("r1"));
            when(getUserRatingsUseCase.execute(any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(ratings));

            mockMvc.perform(get("/api/reviews/user/{userId}", UUID.randomUUID()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }
    }

    @Nested
    @DisplayName("POST /api/reviews")
    class Submit {
        @Test
        @DisplayName("Deve retornar 201 ao submeter avaliação válida")
        void deveRetornar201() throws Exception {
            when(submitRatingUseCase.execute(any())).thenReturn(buildRating("r-new"));

            mockMvc.perform(post("/api/reviews")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                        "titleId": "title-1",
                                        "funRating": 4.5,
                                        "artRating": 5.0,
                                        "storylineRating": 4.0,
                                        "charactersRating": 4.5,
                                        "originalityRating": 3.5,
                                        "pacingRating": 4.0,
                                        "textContent": "Excelente!"
                                    }
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.overallRating").value(4.3));
        }

        @Test
        @DisplayName("Deve retornar 400 quando titleId está em branco")
        void deveRetornar400TitleIdEmBranco() throws Exception {
            mockMvc.perform(post("/api/reviews")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                        "titleId": "",
                                        "funRating": 4.0, "artRating": 4.0,
                                        "storylineRating": 4.0, "charactersRating": 4.0,
                                        "originalityRating": 4.0, "pacingRating": 4.0
                                    }
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando nota é menor que 1")
        void deveRetornar400NotaMenorQue1() throws Exception {
            mockMvc.perform(post("/api/reviews")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                        "titleId": "title-1",
                                        "funRating": 0, "artRating": 4.0,
                                        "storylineRating": 4.0, "charactersRating": 4.0,
                                        "originalityRating": 4.0, "pacingRating": 4.0
                                    }
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando nota é maior que 5")
        void deveRetornar400NotaMaiorQue5() throws Exception {
            mockMvc.perform(post("/api/reviews")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                        "titleId": "title-1",
                                        "funRating": 6, "artRating": 4.0,
                                        "storylineRating": 4.0, "charactersRating": 4.0,
                                        "originalityRating": 4.0, "pacingRating": 4.0
                                    }
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/reviews/{id}")
    class Update {
        @Test
        @DisplayName("Deve retornar 200 ao atualizar avaliação")
        void deveRetornar200() throws Exception {
            when(updateRatingUseCase.execute(any())).thenReturn(buildRating("r1"));

            mockMvc.perform(put("/api/reviews/r1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"funRating": 3.0, "textContent": "Revisando minha opinião"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve retornar 404 quando avaliação não existe")
        void deveRetornar404() throws Exception {
            when(updateRatingUseCase.execute(any()))
                    .thenThrow(new ResourceNotFoundException("Review", "id", "r-inexistente"));

            mockMvc.perform(put("/api/reviews/r-inexistente")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"artRating": 3.0}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/reviews/{id}")
    class Delete {
        @Test
        @DisplayName("Deve retornar 204 ao excluir avaliação")
        void deveRetornar204() throws Exception {
            doNothing().when(deleteRatingUseCase).execute(any(), any());

            mockMvc.perform(delete("/api/reviews/r1").principal(mockAuth()))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("Deve retornar 404 quando avaliação não existe")
        void deveRetornar404() throws Exception {
            org.mockito.Mockito.doThrow(new ResourceNotFoundException("Review", "id", "r-x"))
                    .when(deleteRatingUseCase).execute(any(), any());

            mockMvc.perform(delete("/api/reviews/r-x").principal(mockAuth()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/reviews/{id}/vote")
    class Vote {
        @Test
        @DisplayName("Deve retornar 200 com contadores e myVote ao votar 'up'")
        void deveRetornar200AoVotar() throws Exception {
            when(castReviewVoteUseCase.execute(any(), any(), org.mockito.ArgumentMatchers.eq(VoteValue.UP)))
                    .thenReturn(new VoteResult(8, 1, VoteValue.UP));

            mockMvc.perform(post("/api/reviews/r1/vote")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"value": "up"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.upvotes").value(8))
                    .andExpect(jsonPath("$.data.downvotes").value(1))
                    .andExpect(jsonPath("$.data.myVote").value("up"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando value é inválido")
        void deveRetornar400ValueInvalido() throws Exception {
            mockMvc.perform(post("/api/reviews/r1/vote")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"value": "sideways"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando value está em branco")
        void deveRetornar400ValueEmBranco() throws Exception {
            mockMvc.perform(post("/api/reviews/r1/vote")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"value": ""}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 409 ao votar na própria resenha")
        void deveRetornar409VotoProprio() throws Exception {
            when(castReviewVoteUseCase.execute(any(), any(), any()))
                    .thenThrow(new BusinessRuleException("Não é possível votar na própria resenha", 409));

            mockMvc.perform(post("/api/reviews/r1/vote")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"value": "down"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("Deve retornar 200 e myVote nulo ao remover o voto")
        void deveRetornar200AoRemoverVoto() throws Exception {
            when(removeReviewVoteUseCase.execute(any(), any()))
                    .thenReturn(new VoteResult(7, 1, null));

            mockMvc.perform(delete("/api/reviews/r1/vote").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.upvotes").value(7))
                    .andExpect(jsonPath("$.data.myVote").doesNotExist());
        }
    }
}
