package com.mangareader.application.manga.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.category.port.TagRepositoryPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("GenreValidator")
class GenreValidatorTest {

    @Mock
    private TagRepositoryPort tagRepository;

    @InjectMocks
    private GenreValidator genreValidator;

    @Test
    @DisplayName("Lista nula ou vazia é no-op (não consulta o vocabulário)")
    void nullOuVaziaNoOp() {
        assertThatCode(() -> genreValidator.validate(null)).doesNotThrowAnyException();
        assertThatCode(() -> genreValidator.validate(List.of())).doesNotThrowAnyException();

        verify(tagRepository, never()).findExistingSlugs(any());
    }

    @Test
    @DisplayName("Todos os slugs existem no vocabulário → passa")
    void todosExistem() {
        when(tagRepository.findExistingSlugs(any())).thenReturn(Set.of("ACTION", "DRAMA"));

        assertThatCode(() -> genreValidator.validate(List.of("ACTION", "DRAMA")))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Slug desconhecido → IllegalArgumentException com o(s) inválido(s)")
    void slugDesconhecido() {
        when(tagRepository.findExistingSlugs(any())).thenReturn(Set.of("ACTION"));

        assertThatThrownBy(() -> genreValidator.validate(List.of("ACTION", "NOPE", "XXX")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("NOPE")
                .hasMessageContaining("XXX");
    }
}
