package com.toonlira.application.comment.usecase;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.toonlira.application.comment.port.CommentVoteRepositoryPort;
import com.toonlira.shared.domain.vote.VoteValue;

import lombok.RequiredArgsConstructor;

/**
 * Retorna o voto do usuário para uma lista de comentários (batch), para o
 * frontend pintar o estado dos botões de voto.
 */
@Service
@RequiredArgsConstructor
public class GetUserCommentVotesUseCase {
    private final CommentVoteRepositoryPort voteRepository;

    public Map<String, VoteValue> execute(List<String> commentIds, String userId) {
        return voteRepository.findByCommentIdInAndUserId(commentIds, userId)
                .stream()
                .collect(Collectors.toMap(
                        v -> v.getCommentId(),
                        v -> v.getValue()
                ));
    }
}
