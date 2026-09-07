package com.toonlira.application.user.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.comment.port.CommentRepositoryPort;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.application.user.service.UserProfileSettingsResolver;
import com.toonlira.domain.comment.entity.Comment;
import com.toonlira.domain.comment.valueobject.CommentTarget;
import com.toonlira.domain.user.entity.User;
import com.toonlira.domain.user.entity.UserProfileSettings;
import com.toonlira.domain.user.valueobject.VisibilitySetting;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna comentários paginados de um usuário, respeitando privacidade.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetUserCommentsUseCase {
    private final UserRepositoryPort userRepository;
    private final CommentRepositoryPort commentRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;

    public Page<Comment> execute(UUID targetUserId, UUID viewerUserId, Pageable pageable) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        boolean isOwner = viewerUserId != null && viewerUserId.equals(targetUserId);
        UserProfileSettings settings = profileSettingsResolver.getOrDefault(user);

        if (!isOwner && settings.getCommentVisibility() != VisibilitySetting.PUBLIC) {
            return Page.empty(pageable);
        }

        // Perfil lista comentários em OBRAS (frontend monta link /title/{targetId});
        // respostas de fórum (targetType=FORUM_TOPIC) ficam de fora.
        return commentRepository.findByUserIdAndTargetType(targetUserId.toString(), CommentTarget.TITLE, pageable);
    }
}
