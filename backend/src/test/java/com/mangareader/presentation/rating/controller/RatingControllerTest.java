package com.mangareader.presentation.rating.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
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

import com.mangareader.application.rating.usecase.DeleteRatingUseCase;
import com.mangareader.application.rating.usecase.GetRatingAverageUseCase;
import com.mangareader.application.rating.usecase.GetRatingsByTitleUseCase;
import com.mangareader.application.rating.usecase.GetUserRatingsUseCase;
import com.mangareader.application.rating.usecase.SubmitRatingUseCase;
import com.mangareader.application.rating.usecase.UpdateRatingUseCase;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.shared.exception.ResourceNotFoundException;

@WebMvcTest(RatingController.class)
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
    private SubmitRatingUseCase submitRatingUseCase;

    @MockitoBean
    private UpdateRatingUseCase updateRatingUseCase;

    @MockitoBean
    private DeleteRatingUseCase deleteRatingUseCase;

    @MockitoBean
    private GetUserRatingsUseCase getUserRatingsUseCase;

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
                .userId(USER_ID.toString())
                .userName("ruan")
                .stars(4.5)
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
            when(getRatingsByTitleUseCase.execute(any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(ratings));

            mockMvc.perform(get("/api/ratings/title/title-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].stars").value(4.5));
        }

        @Test
        @DisplayName("Deve retornar página vazia quando título não tem avaliações")
        void deveRetornarPaginaVazia() throws Exception {
            when(getRatingsByTitleUseCase.execute(any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/ratings/title/title-sem-avaliacao"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
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
                                    {"titleId": "title-1", "stars": 4.5, "comment": "Excelente!"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.stars").value(4.5));
        }

        @Test
        @DisplayName("Deve retornar 400 quando titleId está em branco")
        void deveRetornar400TitleIdEmBranco() throws Exception {
            mockMvc.perform(post("/api/ratings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "", "stars": 4.0}
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
                                    {"titleId": "title-1", "stars": 0}
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
                                    {"titleId": "title-1", "stars": 6}
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
                                    {"stars": 3.0, "comment": "Revisando minha opinião"}
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
                                    {"stars": 3.0}
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
}
