package com.mangareader.application.comment.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("GetCommentsByTitleUseCase")
class GetCommentsByTitleUseCaseTest {

    @Mock
    private CommentRepositoryPort commentRepository;

    @InjectMocks
    private GetCommentsByTitleUseCase getCommentsByTitleUseCase;

    private final String TITLE_ID = "title-abc123";

    @Test
    @DisplayName("Deve retornar página de comentários do título")
    void deveRetornarPaginaDeComentarios() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        List<Comment> comments = List.of(
                Comment.builder().id("c1").titleId(TITLE_ID).textContent("Ótimo!").build(),
                Comment.builder().id("c2").titleId(TITLE_ID).textContent("Muito bom!").build()
        );
        Page<Comment> page = new PageImpl<>(comments, pageable, 2);

        when(commentRepository.findByTitleId(TITLE_ID, pageable)).thenReturn(page);

        // Act
        Page<Comment> result = getCommentsByTitleUseCase.execute(TITLE_ID, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
        verify(commentRepository).findByTitleId(TITLE_ID, pageable);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando título não possui comentários")
    void deveRetornarPaginaVaziaQuandoSemComentarios() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Comment> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(commentRepository.findByTitleId(TITLE_ID, pageable)).thenReturn(emptyPage);

        // Act
        Page<Comment> result = getCommentsByTitleUseCase.execute(TITLE_ID, pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
