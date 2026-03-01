package com.mangareader.application.comment.usecase;

import org.springframework.stereotype.Service;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Incrementa like ou dislike de um comentário.
 */
@Service
@RequiredArgsConstructor
public class ReactToCommentUseCase {

    private final CommentRepositoryPort commentRepository;

    public enum ReactionType { LIKE, DISLIKE }

    public Comment execute(String commentId, ReactionType type) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        switch (type) {
            case LIKE -> comment.setLikeCount(comment.getLikeCount() + 1);
            case DISLIKE -> comment.setDislikeCount(comment.getDislikeCount() + 1);
        }

        return commentRepository.save(comment);
    }
}
