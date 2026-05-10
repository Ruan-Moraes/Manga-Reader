package com.mangareader.application.comment.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetCommentsByTitleUseCase")
class GetCommentsByTitleUseCaseTest {

    @Mock
    private CommentRepositoryPort commentRepository;

    @Mock
    private LocaleResolutionService localeResolver;

    @InjectMocks
    private GetCommentsByTitleUseCase getCommentsByTitleUseCase;

    private final String TITLE_ID = "title-abc123";

    @Test
    @DisplayName("Deve retornar comentários particionados pelo idioma do usuário")
    void deveRetornarComentariosFiltradosPorIdioma() {
        Pageable pageable = PageRequest.of(0, 10);
        Comment c = Comment.builder().id("c1").titleId(TITLE_ID).language("pt-BR").build();
        Page<Comment> page = new PageImpl<>(List.of(c), pageable, 1);

        when(localeResolver.currentLanguageTag()).thenReturn("pt-BR");
        when(commentRepository.findByTitleIdAndLanguage(TITLE_ID, "pt-BR", pageable)).thenReturn(page);

        Page<Comment> result = getCommentsByTitleUseCase.execute(TITLE_ID, pageable);

        assertThat(result.getContent()).containsExactly(c);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando não há comentários no idioma ativo")
    void deveRetornarPaginaVaziaQuandoSemComentarios() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Comment> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(localeResolver.currentLanguageTag()).thenReturn("en-US");
        when(commentRepository.findByTitleIdAndLanguage(TITLE_ID, "en-US", pageable)).thenReturn(emptyPage);

        Page<Comment> result = getCommentsByTitleUseCase.execute(TITLE_ID, pageable);

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("crossLanguage=true deve bypassar partição e retornar todos idiomas")
    void crossLanguageRetornaTodos() {
        Pageable pageable = PageRequest.of(0, 10);
        Comment pt = Comment.builder().id("c-pt").titleId(TITLE_ID).language("pt-BR").build();
        Comment en = Comment.builder().id("c-en").titleId(TITLE_ID).language("en-US").build();
        Comment es = Comment.builder().id("c-es").titleId(TITLE_ID).language("es-ES").build();
        Page<Comment> page = new PageImpl<>(List.of(pt, en, es), pageable, 3);

        when(commentRepository.findByTitleId(TITLE_ID, pageable)).thenReturn(page);

        Page<Comment> result = getCommentsByTitleUseCase.execute(TITLE_ID, pageable, true);

        assertThat(result.getContent()).extracting(Comment::getLanguage)
                .containsExactly("pt-BR", "en-US", "es-ES");
        org.mockito.Mockito.verifyNoInteractions(localeResolver);
    }

    @Test
    @DisplayName("crossLanguage=false mantém partição (comportamento default)")
    void crossLanguageFalseMantemParticao() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Comment> page = new PageImpl<>(List.of(), pageable, 0);

        when(localeResolver.currentLanguageTag()).thenReturn("pt-BR");
        when(commentRepository.findByTitleIdAndLanguage(TITLE_ID, "pt-BR", pageable)).thenReturn(page);

        getCommentsByTitleUseCase.execute(TITLE_ID, pageable, false);

        org.mockito.Mockito.verify(commentRepository)
                .findByTitleIdAndLanguage(TITLE_ID, "pt-BR", pageable);
        org.mockito.Mockito.verify(commentRepository, org.mockito.Mockito.never())
                .findByTitleId(TITLE_ID, pageable);
    }
}
