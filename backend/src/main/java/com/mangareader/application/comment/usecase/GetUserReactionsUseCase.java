package com.mangareader.application.comment.usecase;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mangareader.application.comment.port.CommentReactionRepositoryPort;
import com.mangareader.domain.comment.valueobject.ReactionType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetUserReactionsUseCase {

    private final CommentReactionRepositoryPort reactionRepository;

    public Map<String, ReactionType> execute(List<String> commentIds, String userId) {
        return reactionRepository.findByCommentIdInAndUserId(commentIds, userId)
                .stream()
                .collect(Collectors.toMap(
                        r -> r.getCommentId(),
                        r -> r.getReactionType()
                ));
    }
}
