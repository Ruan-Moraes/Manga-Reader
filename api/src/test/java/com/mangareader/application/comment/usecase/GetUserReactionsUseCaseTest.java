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

import com.mangareader.application.comment.port.CommentReactionRepositoryPort;
import com.mangareader.domain.comment.entity.CommentReaction;
import com.mangareader.domain.comment.valueobject.ReactionType;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserReactionsUseCase")
class GetUserReactionsUseCaseTest {

    @Mock
    private CommentReactionRepositoryPort reactionRepository;

    @InjectMocks
    private GetUserReactionsUseCase useCase;

    private static final String USER_ID = "user-1";

    @Test
    @DisplayName("Deve retornar mapa de reações do usuário")
    void deveRetornarMapaDeReacoes() {
        var reactions = List.of(
                CommentReaction.builder().commentId("c1").userId(USER_ID).reactionType(ReactionType.LIKE).build(),
                CommentReaction.builder().commentId("c2").userId(USER_ID).reactionType(ReactionType.DISLIKE).build()
        );

        when(reactionRepository.findByCommentIdInAndUserId(List.of("c1", "c2", "c3"), USER_ID))
                .thenReturn(reactions);

        Map<String, ReactionType> result = useCase.execute(List.of("c1", "c2", "c3"), USER_ID);

        assertThat(result).hasSize(2);
        assertThat(result.get("c1")).isEqualTo(ReactionType.LIKE);
        assertThat(result.get("c2")).isEqualTo(ReactionType.DISLIKE);
        assertThat(result).doesNotContainKey("c3");
    }

    @Test
    @DisplayName("Deve retornar mapa vazio quando não há reações")
    void deveRetornarMapaVazio() {
        when(reactionRepository.findByCommentIdInAndUserId(List.of("c1"), USER_ID))
                .thenReturn(List.of());

        Map<String, ReactionType> result = useCase.execute(List.of("c1"), USER_ID);

        assertThat(result).isEmpty();
    }
}
