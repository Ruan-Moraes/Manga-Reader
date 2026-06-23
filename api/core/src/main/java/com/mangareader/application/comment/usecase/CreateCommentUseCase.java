package com.mangareader.application.comment.usecase;

import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo comentário unificado (root ou resposta) em qualquer alvo.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CreateCommentUseCase {
    private final CommentRepositoryPort commentRepository;
    private final UserRepositoryPort userRepository;
    private final LocaleResolutionService localeResolver;

    public record CreateCommentInput(
            CommentTarget targetType,
            String targetId,
            String textContent,
            String imageContent,
            String parentCommentId,
            UUID userId
    ) {}

    public Comment execute(CreateCommentInput input) {
        if (isBlank(input.textContent()) && isBlank(input.imageContent())) {
            throw new BusinessRuleException("Comentário deve conter texto ou imagem", 400);
        }

        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        if (input.parentCommentId() != null) {
            Comment parent = commentRepository.findById(input.parentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", input.parentCommentId()));

            if (parent.getTargetType() != input.targetType() || !Objects.equals(parent.getTargetId(), input.targetId())) {
                throw new BusinessRuleException("Comentário pai pertence a outro alvo", 400);
            }
        }

        Comment comment = Comment.builder()
                .targetType(input.targetType())
                .targetId(input.targetId())
                .parentCommentId(input.parentCommentId())
                .userId(input.userId().toString())
                .userName(user.getName())
                .userPhoto(user.getPhotoUrl())
                .textContent(input.textContent())
                .imageContent(input.imageContent())
                .isHighlighted(false)
                .edited(false)
                .upvotes(0)
                .downvotes(0)
                .language(localeResolver.currentLanguageTag())
                .updatedAt(java.time.LocalDateTime.now())
                .build();

        return commentRepository.save(comment);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
