package com.mangareader.domain.comment.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("CommentTarget.fromValue")
class CommentTargetTest {

    @Test
    @DisplayName("Resolve os alvos suportados (case-insensitive), incluindo CHAPTER")
    void resolve() {
        assertThat(CommentTarget.fromValue("TITLE")).isEqualTo(CommentTarget.TITLE);
        assertThat(CommentTarget.fromValue("chapter")).isEqualTo(CommentTarget.CHAPTER);
        assertThat(CommentTarget.fromValue("news")).isEqualTo(CommentTarget.NEWS);
        assertThat(CommentTarget.fromValue("Review")).isEqualTo(CommentTarget.REVIEW);
        assertThat(CommentTarget.fromValue("forum_topic")).isEqualTo(CommentTarget.FORUM_TOPIC);
    }

    @Test
    @DisplayName("Lança IllegalArgumentException para valor inválido")
    void lancaParaInvalido() {
        assertThatThrownBy(() -> CommentTarget.fromValue("nope")).isInstanceOf(IllegalArgumentException.class);
    }
}
