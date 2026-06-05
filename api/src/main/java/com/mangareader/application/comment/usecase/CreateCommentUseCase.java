package com.mangareader.application.comment.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

import java.util.UUID;

/**
 * Cria um novo comentário (root ou resposta).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CreateCommentUseCase {
    private final CommentRepositoryPort commentRepository;
    private final UserRepositoryPort userRepository;
    private final LocaleResolutionService localeResolver;

    public record CreateCommentInput(
            String titleId,
            String textContent,
            String imageContent,
            String parentCommentId,
            UUID userId
    ) {}

    public Comment execute(CreateCommentInput input) {
        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        // Validar pai se for resposta
        if (input.parentCommentId() != null) {
            commentRepository.findById(input.parentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", input.parentCommentId()));
        }

        Comment comment = Comment.builder()
                .titleId(input.titleId())
                .parentCommentId(input.parentCommentId())
                .userId(input.userId().toString())
                .userName(user.getName())
                .userPhoto(user.getPhotoUrl())
                .textContent(input.textContent())
                .imageContent(input.imageContent())
                .isHighlighted(false)
                .wasEdited(false)
                .likeCount(0)
                .dislikeCount(0)
                .language(localeResolver.currentLanguageTag())
                .build();

        return commentRepository.save(comment);
    }
}
