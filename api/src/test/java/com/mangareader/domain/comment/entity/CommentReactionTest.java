package com.mangareader.domain.comment.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.comment.valueobject.ReactionType;

@DisplayName("CommentReaction")
class CommentReactionTest {

    @Test
    @DisplayName("Deve construir via builder com todos os campos")
    void deveConstruirViaBuilder() {
        var reaction = CommentReaction.builder()
                .id("r1")
                .commentId("c1")
                .userId("u1")
                .reactionType(ReactionType.LIKE)
                .build();

        assertThat(reaction.getId()).isEqualTo("r1");
        assertThat(reaction.getCommentId()).isEqualTo("c1");
        assertThat(reaction.getUserId()).isEqualTo("u1");
        assertThat(reaction.getReactionType()).isEqualTo(ReactionType.LIKE);
    }

    @Test
    @DisplayName("Deve permitir alteração de reactionType")
    void devePermitirAlteracaoDeReactionType() {
        var reaction = CommentReaction.builder()
                .commentId("c1")
                .userId("u1")
                .reactionType(ReactionType.LIKE)
                .build();

        reaction.setReactionType(ReactionType.DISLIKE);

        assertThat(reaction.getReactionType()).isEqualTo(ReactionType.DISLIKE);
    }

    @Test
    @DisplayName("Deve inicializar com NoArgsConstructor")
    void deveInicializarComNoArgs() {
        var reaction = new CommentReaction();

        assertThat(reaction.getId()).isNull();
        assertThat(reaction.getCommentId()).isNull();
        assertThat(reaction.getReactionType()).isNull();
    }
}
