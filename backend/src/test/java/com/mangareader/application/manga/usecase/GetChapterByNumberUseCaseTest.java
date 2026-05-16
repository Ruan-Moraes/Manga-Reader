package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetChapterByNumberUseCase")
class GetChapterByNumberUseCaseTest {
    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private GetChapterByNumberUseCase getChapterByNumberUseCase;

    private Title buildTitleWithChapters() {
        List<Chapter> chapters = List.of(
                Chapter.builder().number("1").title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("O Início")).releaseDate("2020-01-01").pages("24").build(),
                Chapter.builder().number("2").title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("A Jornada")).releaseDate("2020-01-15").pages("22").build(),
                Chapter.builder().number("3").title(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("O Confronto")).releaseDate("2020-02-01").pages("26").build()
        );

        return Title.builder().id("abc123").name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Naruto")).chapters(chapters).build();
    }

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {
        @Test
        @DisplayName("Deve retornar capítulo pelo número")
        void deveRetornarCapituloPeloNumero() {
            when(titleRepository.findById("abc123")).thenReturn(Optional.of(buildTitleWithChapters()));

            Chapter result = getChapterByNumberUseCase.execute("abc123", "2");

            assertThat(result).isNotNull();
            assertThat(result.getNumber()).isEqualTo("2");
            assertThat(result.getTitle().resolve(null)).isEqualTo("A Jornada");
            assertThat(result.getPages()).isEqualTo("22");
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {
        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando título não existe")
        void deveLancarExcecaoQuandoTituloNaoExiste() {
            when(titleRepository.findById("inexistente")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> getChapterByNumberUseCase.execute("inexistente", "1"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Title");
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando capítulo não existe")
        void deveLancarExcecaoQuandoCapituloNaoExiste() {
            when(titleRepository.findById("abc123")).thenReturn(Optional.of(buildTitleWithChapters()));

            assertThatThrownBy(() -> getChapterByNumberUseCase.execute("abc123", "999"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Chapter")
                    .hasMessageContaining("999");
        }
    }
}
