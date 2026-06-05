package com.mangareader.domain.comment.valueobject;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ReactionType")
class ReactionTypeTest {

    @Test
    @DisplayName("Deve conter LIKE e DISLIKE")
    void deveConterLikeEDislike() {
        assertThat(ReactionType.values())
                .containsExactly(ReactionType.LIKE, ReactionType.DISLIKE);
    }

    @Test
    @DisplayName("Deve retornar nome correto via valueOf")
    void deveRetornarNomeCorreto() {
        assertThat(ReactionType.valueOf("LIKE")).isEqualTo(ReactionType.LIKE);
        assertThat(ReactionType.valueOf("DISLIKE")).isEqualTo(ReactionType.DISLIKE);
    }
}
