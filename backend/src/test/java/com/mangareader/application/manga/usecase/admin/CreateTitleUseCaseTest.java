package com.mangareader.application.manga.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateTitleUseCase")
class CreateTitleUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private CreateTitleUseCase createTitleUseCase;

    @Test
    @DisplayName("Deve criar título com todos os campos")
    void deveCriarTituloComTodosCampos() {
        when(titleRepository.save(any(Title.class))).thenAnswer(inv -> {
            Title t = inv.getArgument(0);
            t.setId("generated-id");
            return t;
        });

        Title result = createTitleUseCase.execute(
                "Naruto", "manga", "cover.jpg", "Synopsis here",
                List.of("Action", "Adventure"), "ONGOING", "Kishimoto",
                "Kishimoto", "Shueisha", false
        );

        assertThat(result.getName()).isEqualTo("Naruto");
        assertThat(result.getType()).isEqualTo("manga");
        assertThat(result.getGenres()).containsExactly("Action", "Adventure");
        assertThat(result.isAdult()).isFalse();
        verify(titleRepository).save(any(Title.class));
    }

    @Test
    @DisplayName("Deve criar título com genres null tratados como lista vazia")
    void deveCriarTituloComGenresNull() {
        when(titleRepository.save(any(Title.class))).thenAnswer(inv -> inv.getArgument(0));

        Title result = createTitleUseCase.execute(
                "Test", "manhwa", null, null, null, null, null, null, null, false
        );

        assertThat(result.getGenres()).isEmpty();
    }
}
