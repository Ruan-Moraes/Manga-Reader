package com.mangareader.application.contact.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;

import com.mangareader.application.shared.port.EmailPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("PublishWorkContactUseCase")
class PublishWorkContactUseCaseTest {
    @Mock
    private EmailPort emailPort;

    @Mock
    private MessageSource messageSource;

    @InjectMocks
    private PublishWorkContactUseCase useCase;

    @BeforeEach
    void setUp() {
        lenient().when(messageSource.getMessage(eq("email.footer.tagline"), any(), any()))
                .thenReturn("Manga Reader — Sua plataforma de mangás");
    }

    private static final PublishWorkContactUseCase.PublishWorkInput VALID_INPUT =
            new PublishWorkContactUseCase.PublishWorkInput(
                    "Ruan Silva",
                    "ruan@test.com",
                    "manga",
                    "Minha Obra",
                    "Uma sinopse interessante sobre a historia",
                    "https://portfolio.com",
                    "Gostaria de publicar meu trabalho na plataforma"
            );

    @Test
    @DisplayName("Deve enviar email ao admin e ao autor")
    void deveEnviarEmailAoAdminEAoAutor() {
        useCase.execute(VALID_INPUT);

        verify(emailPort, times(2)).sendHtml(any(), any(), any());
    }

    @Test
    @DisplayName("Deve enviar notificacao com dados do formulario ao admin")
    void deveEnviarNotificacaoAoAdmin() {
        useCase.execute(VALID_INPUT);

        var bodyCaptor = ArgumentCaptor.forClass(String.class);
        var toCaptor = ArgumentCaptor.forClass(String.class);
        var subjectCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailPort, times(2)).sendHtml(
                toCaptor.capture(), subjectCaptor.capture(), bodyCaptor.capture());

        // Primeiro email e para o admin (default @Value nao e injetado em testes unitarios, sera null)
        // Segundo email e para o autor
        var bodies = bodyCaptor.getAllValues();
        var recipients = toCaptor.getAllValues();
        var subjects = subjectCaptor.getAllValues();

        // Email de notificacao (admin) contem os dados do formulario
        String adminBody = bodies.get(0);

        assertThat(adminBody).contains("Ruan Silva");
        assertThat(adminBody).contains("ruan@test.com");
        assertThat(adminBody).contains("manga");
        assertThat(adminBody).contains("Minha Obra");
        assertThat(adminBody).contains("Uma sinopse interessante");
        assertThat(adminBody).contains("https://portfolio.com");
        assertThat(adminBody).contains("Gostaria de publicar");

        assertThat(subjects.get(0)).contains("Minha Obra");
    }

    @Test
    @DisplayName("Deve enviar confirmacao ao autor com nome e titulo da obra")
    void deveEnviarConfirmacaoAoAutor() {
        useCase.execute(VALID_INPUT);

        var bodyCaptor = ArgumentCaptor.forClass(String.class);
        var toCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailPort, times(2)).sendHtml(
                toCaptor.capture(), any(), bodyCaptor.capture());

        String authorBody = bodyCaptor.getAllValues().get(1);
        String authorRecipient = toCaptor.getAllValues().get(1);

        assertThat(authorRecipient).isEqualTo("ruan@test.com");
        assertThat(authorBody).contains("Ruan Silva");
        assertThat(authorBody).contains("Minha Obra");
        assertThat(authorBody).contains("Solicitação Recebida");
    }

    @Test
    @DisplayName("Deve tratar portfolio link nulo como Nao informado")
    void deveTratarPortfolioLinkNulo() {
        var inputSemPortfolio = new PublishWorkContactUseCase.PublishWorkInput(
                "Autor", "autor@test.com", "webtoon", "Obra",
                "Sinopse da obra aqui", null, "Mensagem de contato aqui"
        );

        useCase.execute(inputSemPortfolio);

        var bodyCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailPort, times(2)).sendHtml(any(), any(), bodyCaptor.capture());

        assertThat(bodyCaptor.getAllValues().get(0)).contains("Não informado");
    }

    @Test
    @DisplayName("Deve tratar portfolio link vazio como Nao informado")
    void deveTratarPortfolioLinkVazio() {
        var inputPortfolioVazio = new PublishWorkContactUseCase.PublishWorkInput(
                "Autor", "autor@test.com", "fanfic", "Obra",
                "Sinopse da obra aqui", "   ", "Mensagem de contato aqui"
        );

        useCase.execute(inputPortfolioVazio);

        var bodyCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailPort, times(2)).sendHtml(any(), any(), bodyCaptor.capture());

        assertThat(bodyCaptor.getAllValues().get(0)).contains("Não informado");
    }

}
