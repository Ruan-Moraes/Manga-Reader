package com.mangareader.presentation.rating.controller;

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

import com.mangareader.application.rating.port.RatingRepositoryPort.RatingDistribution;
import com.mangareader.application.rating.port.ReviewVoteRepositoryPort;
import com.mangareader.application.rating.usecase.CastReviewVoteUseCase;
import com.mangareader.application.rating.usecase.DeleteRatingUseCase;
import com.mangareader.application.rating.usecase.GetRatingAverageUseCase;
import com.mangareader.application.rating.usecase.GetRatingDistributionUseCase;
import com.mangareader.application.rating.usecase.GetRatingsByTitleUseCase;
import com.mangareader.application.rating.usecase.GetUserRatingsUseCase;
import com.mangareader.application.rating.usecase.RemoveReviewVoteUseCase;
import com.mangareader.application.rating.usecase.ReviewVoteResult;
import com.mangareader.application.rating.usecase.SubmitRatingUseCase;
import com.mangareader.application.rating.usecase.UpdateRatingUseCase;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.domain.rating.valueobject.VoteValue;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(RatingController.class)
@Import(PageableWebConfig.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("RatingController")
class RatingControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetRatingsByTitleUseCase getRatingsByTitleUseCase;

    @MockitoBean
    private GetRatingAverageUseCase getRatingAverageUseCase;

    @MockitoBean
    private GetRatingDistributionUseCase getRatingDistributionUseCase;

    @MockitoBean
    private SubmitRatingUseCase submitRatingUseCase;

    @MockitoBean
    private UpdateRatingUseCase updateRatingUseCase;

    @MockitoBean
    private DeleteRatingUseCase deleteRatingUseCase;

    @MockitoBean
    private GetUserRatingsUseCase getUserRatingsUseCase;

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

    private MangaRating buildRating(String id) {
        return MangaRating.builder()
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
                .comment("Ótimo mangá!")
                .build();
    }

    @Nested
    @DisplayName("GET /api/ratings/title/{titleId}")
    class GetByTitle {
        @Test
        @DisplayName("Deve retornar 200 com avaliações paginadas do título")
        void deveRetornar200ComAvaliacoes() throws Exception {
            var ratings = List.of(buildRating("r1"), buildRating("r2"));

            when(getRatingsByTitleUseCase.execute(any(), any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(ratings));

            mockMvc.perform(get("/api/ratings/title/title-1"))
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

            mockMvc.perform(get("/api/ratings/title/title-sem-avaliacao"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }

        @Test
        @DisplayName("Deve repassar o filtro ?star=5 ao use case")
        void deveRepassarFiltroStar() throws Exception {
            when(getRatingsByTitleUseCase.execute(any(), any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(buildRating("r1"))));

            mockMvc.perform(get("/api/ratings/title/title-1").param("star", "5"))
                    .andExpect(status().isOk());

            verify(getRatingsByTitleUseCase).execute(org.mockito.ArgumentMatchers.eq("title-1"),
                    org.mockito.ArgumentMatchers.eq(5), any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("GET /api/ratings/title/{titleId}/average")
    class GetAverage {
        @Test
        @DisplayName("Deve retornar 200 com média e contagem de avaliações")
        void deveRetornar200ComMedia() throws Exception {
            when(getRatingAverageUseCase.execute("title-1"))
                    .thenReturn(new GetRatingAverageUseCase.RatingAverage(4.2, 150L));

            mockMvc.perform(get("/api/ratings/title/title-1/average"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.average").value(4.2))
                    .andExpect(jsonPath("$.data.count").value(150));
        }
    }

    @Nested
    @DisplayName("GET /api/ratings/title/{titleId}/distribution")
    class GetDistribution {
        @Test
        @DisplayName("Deve retornar 200 com a contagem por estrela e o total")
        void deveRetornar200ComDistribuicao() throws Exception {
            when(getRatingDistributionUseCase.execute("title-1"))
                    .thenReturn(new RatingDistribution(2, 1, 5, 20, 72));

            mockMvc.perform(get("/api/ratings/title/title-1/distribution"))
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
                    .thenReturn(RatingDistribution.empty());

            mockMvc.perform(get("/api/ratings/title/title-vazio/distribution"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.total").value(0));
        }
    }

    @Nested
    @DisplayName("GET /api/ratings/user")
    class GetUserRatings {
        @Test
        @DisplayName("Deve retornar 200 com avaliações do usuário autenticado")
        void deveRetornar200ComAvaliacoesDoUsuario() throws Exception {
            var ratings = List.of(buildRating("r1"));
            when(getUserRatingsUseCase.execute(any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(ratings));

            mockMvc.perform(get("/api/ratings/user").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(1));
        }
    }

    @Nested
    @DisplayName("POST /api/ratings")
    class Submit {
        @Test
        @DisplayName("Deve retornar 201 ao submeter avaliação válida")
        void deveRetornar201() throws Exception {
            when(submitRatingUseCase.execute(any())).thenReturn(buildRating("r-new"));

            mockMvc.perform(post("/api/ratings")
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
                                        "comment": "Excelente!"
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
            mockMvc.perform(post("/api/ratings")
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
            mockMvc.perform(post("/api/ratings")
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
            mockMvc.perform(post("/api/ratings")
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
    @DisplayName("PUT /api/ratings/{id}")
    class Update {
        @Test
        @DisplayName("Deve retornar 200 ao atualizar avaliação")
        void deveRetornar200() throws Exception {
            when(updateRatingUseCase.execute(any())).thenReturn(buildRating("r1"));

            mockMvc.perform(put("/api/ratings/r1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"funRating": 3.0, "comment": "Revisando minha opinião"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve retornar 404 quando avaliação não existe")
        void deveRetornar404() throws Exception {
            when(updateRatingUseCase.execute(any()))
                    .thenThrow(new ResourceNotFoundException("Rating", "id", "r-inexistente"));

            mockMvc.perform(put("/api/ratings/r-inexistente")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"artRating": 3.0}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/ratings/{id}")
    class Delete {
        @Test
        @DisplayName("Deve retornar 204 ao excluir avaliação")
        void deveRetornar204() throws Exception {
            doNothing().when(deleteRatingUseCase).execute(any(), any());

            mockMvc.perform(delete("/api/ratings/r1").principal(mockAuth()))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("Deve retornar 404 quando avaliação não existe")
        void deveRetornar404() throws Exception {
            org.mockito.Mockito.doThrow(new ResourceNotFoundException("Rating", "id", "r-x"))
                    .when(deleteRatingUseCase).execute(any(), any());

            mockMvc.perform(delete("/api/ratings/r-x").principal(mockAuth()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/ratings/{id}/vote")
    class Vote {
        @Test
        @DisplayName("Deve retornar 200 com contadores e myVote ao votar 'up'")
        void deveRetornar200AoVotar() throws Exception {
            when(castReviewVoteUseCase.execute(any(), any(), org.mockito.ArgumentMatchers.eq(VoteValue.UP)))
                    .thenReturn(new ReviewVoteResult(8, 1, VoteValue.UP));

            mockMvc.perform(post("/api/ratings/r1/vote")
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
            mockMvc.perform(post("/api/ratings/r1/vote")
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
            mockMvc.perform(post("/api/ratings/r1/vote")
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

            mockMvc.perform(post("/api/ratings/r1/vote")
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
                    .thenReturn(new ReviewVoteResult(7, 1, null));

            mockMvc.perform(delete("/api/ratings/r1/vote").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.upvotes").value(7))
                    .andExpect(jsonPath("$.data.myVote").doesNotExist());
        }
    }
}
