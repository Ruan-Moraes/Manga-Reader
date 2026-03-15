package com.mangareader.application.comment.usecase;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.mangareader.application.comment.port.CommentReactionRepositoryPort;
import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.entity.CommentReaction;
import com.mangareader.domain.comment.valueobject.ReactionType;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReactToCommentUseCase {

    private final CommentRepositoryPort commentRepository;
    private final CommentReactionRepositoryPort reactionRepository;

    public Comment execute(String commentId, ReactionType type, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        Optional<CommentReaction> existing = reactionRepository.findByCommentIdAndUserId(commentId, userId);

        if (existing.isEmpty()) {
            // New reaction
            reactionRepository.save(CommentReaction.builder()
                    .commentId(commentId)
                    .userId(userId)
                    .reactionType(type)
                    .build());

            if (type == ReactionType.LIKE) {
                comment.setLikeCount(comment.getLikeCount() + 1);
            } else {
                comment.setDislikeCount(comment.getDislikeCount() + 1);
            }
        } else if (existing.get().getReactionType() == type) {
            // Toggle off — same type
            reactionRepository.delete(existing.get());

            if (type == ReactionType.LIKE) {
                comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1));
            } else {
                comment.setDislikeCount(Math.max(0, comment.getDislikeCount() - 1));
            }
        } else {
            // Switch — opposite type
            CommentReaction reaction = existing.get();
            ReactionType oldType = reaction.getReactionType();
            reaction.setReactionType(type);
            reactionRepository.save(reaction);

            if (oldType == ReactionType.LIKE) {
                comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1));
                comment.setDislikeCount(comment.getDislikeCount() + 1);
            } else {
                comment.setDislikeCount(Math.max(0, comment.getDislikeCount() - 1));
                comment.setLikeCount(comment.getLikeCount() + 1);
            }
        }

        return commentRepository.save(comment);
    }
}
