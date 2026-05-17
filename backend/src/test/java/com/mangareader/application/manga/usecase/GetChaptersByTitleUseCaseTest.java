package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetChaptersByTitleUseCase")
class GetChaptersByTitleUseCaseTest {
    @Mock
    private ChapterRepositoryPort chapterRepository;

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private GetChaptersByTitleUseCase getChaptersByTitleUseCase;

    private final Pageable pageable = PageRequest.of(0, 20);

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {
        @Test
        @DisplayName("Deve retornar página de capítulos do título")
        void deveRetornarCapitulosDoTitulo() {
            Title title = Title.builder().id("abc123")
                    .name(LocalizedString.ofDefault("Naruto")).build();
            Page<Chapter> page = new PageImpl<>(List.of(
                    Chapter.builder().titleId("abc123").number("1")
                            .title(LocalizedString.ofDefault("O Início")).build(),
                    Chapter.builder().titleId("abc123").number("2")
                            .title(LocalizedString.ofDefault("A Jornada")).build()));

            when(titleRepository.findById("abc123")).thenReturn(Optional.of(title));
            when(chapterRepository.findByTitleId(eq("abc123"), any(Pageable.class)))
                    .thenReturn(page);

            Page<Chapter> result = getChaptersByTitleUseCase.execute("abc123", pageable);

            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent().get(0).getNumber()).isEqualTo("1");
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {
        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando título não existe")
        void deveLancarExcecaoQuandoTituloNaoExiste() {
            when(titleRepository.findById("inexistente")).thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    getChaptersByTitleUseCase.execute("inexistente", pageable))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Title");
        }
    }
}
