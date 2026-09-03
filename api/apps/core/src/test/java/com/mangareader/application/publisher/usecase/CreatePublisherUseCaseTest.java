package com.mangareader.application.publisher.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.application.publisher.usecase.CreatePublisherUseCase.CreatePublisherInput;
import com.mangareader.domain.publisher.entity.Publisher;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreatePublisherUseCase")
class CreatePublisherUseCaseTest {

    @Mock
    private PublisherRepositoryPort publisherRepository;

    @InjectMocks
    private CreatePublisherUseCase createPublisherUseCase;

    @Test
    @DisplayName("Deve criar editora derivando slug do nome")
    void deveCriarEditoraComSlug() {
        when(publisherRepository.existsBySlug(any())).thenReturn(false);
        when(publisherRepository.save(any(Publisher.class))).thenAnswer(inv -> inv.getArgument(0));

        Publisher result = createPublisherUseCase.execute(
                new CreatePublisherInput("Shueisha", "JP", "https://shueisha.co.jp"));

        assertThat(result.getName()).isEqualTo("Shueisha");
        assertThat(result.getSlug()).isEqualTo("shueisha");
        assertThat(result.getCountry()).isEqualTo("JP");
        assertThat(result.getWebsite()).isEqualTo("https://shueisha.co.jp");
    }

    @Test
    @DisplayName("Deve anexar sufixo numérico quando slug já existe")
    void deveAnexarSufixoEmColisao() {
        when(publisherRepository.existsBySlug("shueisha")).thenReturn(true);
        when(publisherRepository.existsBySlug("shueisha-2")).thenReturn(false);
        when(publisherRepository.save(any(Publisher.class))).thenAnswer(inv -> inv.getArgument(0));

        Publisher result = createPublisherUseCase.execute(
                new CreatePublisherInput("Shueisha", null, null));

        assertThat(result.getSlug()).isEqualTo("shueisha-2");
    }
}
