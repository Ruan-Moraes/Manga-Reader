package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetChapterByNumberUseCase")
class GetChapterByNumberUseCaseTest {
    @Mock
    private ChapterRepositoryPort chapterRepository;

    @InjectMocks
    private GetChapterByNumberUseCase getChapterByNumberUseCase;

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {
        @Test
        @DisplayName("Deve retornar capítulo pelo número")
        void deveRetornarCapituloPeloNumero() {
            Chapter chapter = Chapter.builder().titleId("abc123").number("2")
                    .title(LocalizedString.ofDefault("A Jornada"))
                    .releaseDate("2020-01-15").pages("22").build();

            when(chapterRepository.findByTitleIdAndNumber("abc123", "2"))
                    .thenReturn(Optional.of(chapter));

            Chapter result = getChapterByNumberUseCase.execute("abc123", "2");

            assertThat(result.getNumber()).isEqualTo("2");
            assertThat(result.getTitle().resolve(null)).isEqualTo("A Jornada");
            assertThat(result.getPages()).isEqualTo("22");
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {
        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando capítulo não existe")
        void deveLancarExcecaoQuandoCapituloNaoExiste() {
            when(chapterRepository.findByTitleIdAndNumber("abc123", "999"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    getChapterByNumberUseCase.execute("abc123", "999"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Chapter")
                    .hasMessageContaining("999");
        }
    }
}
