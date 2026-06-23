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
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetCommentsByTargetUseCase")
class GetCommentsByTargetUseCaseTest {
    @Mock
    private CommentRepositoryPort commentRepository;

    @Mock
    private LocaleResolutionService localeResolver;

    @InjectMocks
    private GetCommentsByTargetUseCase useCase;

    private static final CommentTarget TYPE = CommentTarget.TITLE;
    private final String TARGET_ID = "title-abc123";

    @Test
    @DisplayName("Deve retornar comentários particionados pelo idioma do usuário")
    void deveRetornarComentariosFiltradosPorIdioma() {
        Pageable pageable = PageRequest.of(0, 10);
        Comment c = Comment.builder().id("c1").targetType(TYPE).targetId(TARGET_ID).language("pt-BR").build();
        Page<Comment> page = new PageImpl<>(List.of(c), pageable, 1);

        when(localeResolver.currentContentLanguageTags()).thenReturn(List.of("pt-BR"));
        when(commentRepository.findByTargetTypeAndTargetIdAndLanguageIn(TYPE, TARGET_ID, List.of("pt-BR"), pageable))
                .thenReturn(page);

        Page<Comment> result = useCase.execute(TYPE, TARGET_ID, pageable);

        assertThat(result.getContent()).containsExactly(c);
    }

    @Test
    @DisplayName("crossLanguage=true deve bypassar partição e retornar todos idiomas")
    void crossLanguageRetornaTodos() {
        Pageable pageable = PageRequest.of(0, 10);
        Comment pt = Comment.builder().id("c-pt").targetType(TYPE).targetId(TARGET_ID).language("pt-BR").build();
        Comment en = Comment.builder().id("c-en").targetType(TYPE).targetId(TARGET_ID).language("en-US").build();
        Page<Comment> page = new PageImpl<>(List.of(pt, en), pageable, 2);

        when(commentRepository.findByTargetTypeAndTargetId(TYPE, TARGET_ID, pageable)).thenReturn(page);

        Page<Comment> result = useCase.execute(TYPE, TARGET_ID, pageable, true);

        assertThat(result.getContent()).extracting(Comment::getLanguage).containsExactly("pt-BR", "en-US");
        org.mockito.Mockito.verifyNoInteractions(localeResolver);
    }

    @Test
    @DisplayName("crossLanguage=false mantém partição (comportamento default)")
    void crossLanguageFalseMantemParticao() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Comment> page = new PageImpl<>(List.of(), pageable, 0);

        when(localeResolver.currentContentLanguageTags()).thenReturn(List.of("pt-BR"));
        when(commentRepository.findByTargetTypeAndTargetIdAndLanguageIn(TYPE, TARGET_ID, List.of("pt-BR"), pageable))
                .thenReturn(page);

        useCase.execute(TYPE, TARGET_ID, pageable, false);

        org.mockito.Mockito.verify(commentRepository)
                .findByTargetTypeAndTargetIdAndLanguageIn(TYPE, TARGET_ID, List.of("pt-BR"), pageable);
        org.mockito.Mockito.verify(commentRepository, org.mockito.Mockito.never())
                .findByTargetTypeAndTargetId(TYPE, TARGET_ID, pageable);
    }
}
