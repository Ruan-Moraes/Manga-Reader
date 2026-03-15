package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna comentários paginados de um usuário, respeitando privacidade.
 */
@Service
@RequiredArgsConstructor
public class GetUserCommentsUseCase {

    private final UserRepositoryPort userRepository;
    private final CommentRepositoryPort commentRepository;

    public Page<Comment> execute(UUID targetUserId, UUID viewerUserId, Pageable pageable) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        boolean isOwner = viewerUserId != null && viewerUserId.equals(targetUserId);

        if (!isOwner && user.getCommentVisibility() != VisibilitySetting.PUBLIC) {
            return Page.empty(pageable);
        }

        return commentRepository.findByUserId(targetUserId.toString(), pageable);
    }
}
