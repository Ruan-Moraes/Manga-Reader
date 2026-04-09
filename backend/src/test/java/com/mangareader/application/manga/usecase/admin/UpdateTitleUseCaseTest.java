package com.mangareader.application.manga.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateTitleUseCase")
class UpdateTitleUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private UpdateTitleUseCase updateTitleUseCase;

    private Title buildTitle() {
        return Title.builder()
                .id("title-1")
                .name("Original")
                .type("manga")
                .status("ONGOING")
                .genres(List.of("Action"))
                .build();
    }

    @Test
    @DisplayName("Deve atualizar apenas campos não-null")
    void deveAtualizarApenasCamposNaoNull() {
        Title title = buildTitle();
        when(titleRepository.findById("title-1")).thenReturn(Optional.of(title));
        when(titleRepository.save(any(Title.class))).thenAnswer(inv -> inv.getArgument(0));

        Title result = updateTitleUseCase.execute(
                "title-1", "New Name", null, null, null, null, null, null, null, null, null
        );

        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getType()).isEqualTo("manga");
        assertThat(result.getStatus()).isEqualTo("ONGOING");
        verify(titleRepository).save(title);
    }

    @Test
    @DisplayName("Deve atualizar todos os campos quando fornecidos")
    void deveAtualizarTodosCampos() {
        Title title = buildTitle();
        when(titleRepository.findById("title-1")).thenReturn(Optional.of(title));
        when(titleRepository.save(any(Title.class))).thenAnswer(inv -> inv.getArgument(0));

        Title result = updateTitleUseCase.execute(
                "title-1", "New", "manhwa", "new-cover.jpg", "New synopsis",
                List.of("Romance"), "COMPLETED", "New Author", "New Artist", "New Publisher", true
        );

        assertThat(result.getName()).isEqualTo("New");
        assertThat(result.getType()).isEqualTo("manhwa");
        assertThat(result.isAdult()).isTrue();
        assertThat(result.getGenres()).containsExactly("Romance");
    }

    @Test
    @DisplayName("Deve lançar exceção quando título não existe")
    void deveLancarExcecaoQuandoNaoExiste() {
        when(titleRepository.findById("invalid")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateTitleUseCase.execute(
                "invalid", "Name", null, null, null, null, null, null, null, null, null
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Title");
    }
}
