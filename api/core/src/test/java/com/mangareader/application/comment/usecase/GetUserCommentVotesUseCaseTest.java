package com.mangareader.application.comment.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.port.CommentVoteRepositoryPort;
import com.mangareader.domain.comment.entity.CommentVote;
import com.mangareader.shared.domain.vote.VoteValue;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserCommentVotesUseCase")
class GetUserCommentVotesUseCaseTest {

    @Mock
    private CommentVoteRepositoryPort voteRepository;

    @InjectMocks
    private GetUserCommentVotesUseCase useCase;

    private static final String USER_ID = "user-1";

    @Test
    @DisplayName("Deve retornar mapa de votos do usuário")
    void deveRetornarMapaDeVotos() {
        var votes = List.of(
                CommentVote.builder().commentId("c1").userId(USER_ID).value(VoteValue.UP).build(),
                CommentVote.builder().commentId("c2").userId(USER_ID).value(VoteValue.DOWN).build()
        );

        when(voteRepository.findByCommentIdInAndUserId(List.of("c1", "c2", "c3"), USER_ID))
                .thenReturn(votes);

        Map<String, VoteValue> result = useCase.execute(List.of("c1", "c2", "c3"), USER_ID);

        assertThat(result).hasSize(2);
        assertThat(result.get("c1")).isEqualTo(VoteValue.UP);
        assertThat(result.get("c2")).isEqualTo(VoteValue.DOWN);
        assertThat(result).doesNotContainKey("c3");
    }

    @Test
    @DisplayName("Deve retornar mapa vazio quando não há votos")
    void deveRetornarMapaVazio() {
        when(voteRepository.findByCommentIdInAndUserId(List.of("c1"), USER_ID))
                .thenReturn(List.of());

        Map<String, VoteValue> result = useCase.execute(List.of("c1"), USER_ID);

        assertThat(result).isEmpty();
    }
}
