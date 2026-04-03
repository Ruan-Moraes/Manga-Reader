package com.mangareader.presentation.contact.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.contact.usecase.PublishWorkContactUseCase;

@WebMvcTest(ContactController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ContactController")
class ContactControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private PublishWorkContactUseCase publishWorkContactUseCase;

    private static final String ENDPOINT = "/api/contact/publish-work";

    private static final String VALID_REQUEST = """
            {
                "name": "Ruan Silva",
                "email": "ruan@test.com",
                "workType": "manga",
                "workTitle": "Minha Obra Incrivel",
                "synopsis": "Uma sinopse interessante sobre a historia do protagonista",
                "portfolioLink": "https://portfolio.com",
                "message": "Gostaria de publicar meu trabalho na plataforma de voces"
            }
            """;

    @Nested
    @DisplayName("POST /api/contact/publish-work")
    class PublishWork {
        @Test
        @DisplayName("Deve retornar 200 com mensagem de sucesso para request valido")
        void deveRetornar200ParaRequestValido() throws Exception {
            doNothing().when(publishWorkContactUseCase).execute(any());

            mockMvc.perform(post(ENDPOINT)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_REQUEST))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isString());

            verify(publishWorkContactUseCase).execute(any());
        }

        @Test
        @DisplayName("Deve retornar 400 quando nome esta em branco")
        void deveRetornar400QuandoNomeEmBranco() throws Exception {
            String request = """
                    {
                        "name": "",
                        "email": "ruan@test.com",
                        "workType": "manga",
                        "workTitle": "Minha Obra",
                        "synopsis": "Uma sinopse interessante sobre a historia",
                        "message": "Gostaria de publicar meu trabalho aqui"
                    }
                    """;

            mockMvc.perform(post(ENDPOINT)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(request))
                    .andExpect(status().isBadRequest());

            verify(publishWorkContactUseCase, never()).execute(any());
        }

        @Test
        @DisplayName("Deve retornar 400 quando email e invalido")
        void deveRetornar400QuandoEmailInvalido() throws Exception {
            String request = """
                    {
                        "name": "Ruan Silva",
                        "email": "email-invalido",
                        "workType": "manga",
                        "workTitle": "Minha Obra",
                        "synopsis": "Uma sinopse interessante sobre a historia",
                        "message": "Gostaria de publicar meu trabalho aqui"
                    }
                    """;

            mockMvc.perform(post(ENDPOINT)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(request))
                    .andExpect(status().isBadRequest());

            verify(publishWorkContactUseCase, never()).execute(any());
        }

        @Test
        @DisplayName("Deve retornar 400 quando sinopse tem menos de 10 caracteres")
        void deveRetornar400QuandoSinopseMuitoCurta() throws Exception {
            String request = """
                    {
                        "name": "Ruan Silva",
                        "email": "ruan@test.com",
                        "workType": "manga",
                        "workTitle": "Minha Obra",
                        "synopsis": "Curta",
                        "message": "Gostaria de publicar meu trabalho aqui"
                    }
                    """;

            mockMvc.perform(post(ENDPOINT)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(request))
                    .andExpect(status().isBadRequest());

            verify(publishWorkContactUseCase, never()).execute(any());
        }

        @Test
        @DisplayName("Deve retornar 400 quando campos obrigatorios estao ausentes")
        void deveRetornar400QuandoCamposAusentes() throws Exception {
            String request = """
                    {
                        "name": "Ruan Silva"
                    }
                    """;

            mockMvc.perform(post(ENDPOINT)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(request))
                    .andExpect(status().isBadRequest());

            verify(publishWorkContactUseCase, never()).execute(any());
        }

        @Test
        @DisplayName("Deve aceitar request sem portfolioLink (campo opcional)")
        void deveAceitarSemPortfolioLink() throws Exception {
            String request = """
                    {
                        "name": "Ruan Silva",
                        "email": "ruan@test.com",
                        "workType": "manga",
                        "workTitle": "Minha Obra Incrivel",
                        "synopsis": "Uma sinopse interessante sobre a historia do protagonista",
                        "message": "Gostaria de publicar meu trabalho na plataforma de voces"
                    }
                    """;

            doNothing().when(publishWorkContactUseCase).execute(any());

            mockMvc.perform(post(ENDPOINT)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(request))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}
