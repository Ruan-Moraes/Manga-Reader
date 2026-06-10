package com.mangareader.application.forum.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.application.forum.usecase.GetForumTopicByIdUseCase.ForumTopicDetail;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetForumTopicByIdUseCase")
class GetForumTopicByIdUseCaseTest {

    @Mock
    private ForumRepositoryPort forumRepository;

    @Mock
    private CommentRepositoryPort commentRepository;

    @InjectMocks
    private GetForumTopicByIdUseCase getForumTopicByIdUseCase;

    private static final String TOPIC_ID = "topic-1";

    @Test
    @DisplayName("Deve retornar tópico com respostas (comments do alvo)")
    void deveRetornarTopicoComRespostas() {
        ForumTopic topic = ForumTopic.builder()
                .id(TOPIC_ID)
                .authorId("author-1")
                .authorName("Autor")
                .title("Tópico de teste")
                .category(ForumCategory.GERAL)
                .build();
        Comment reply = Comment.builder()
                .id("reply-1")
                .targetType(CommentTarget.FORUM_TOPIC)
                .targetId(TOPIC_ID)
                .textContent("Resposta")
                .build();

        when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.of(topic));
        when(commentRepository.findByTargetTypeAndTargetId(CommentTarget.FORUM_TOPIC, TOPIC_ID))
                .thenReturn(List.of(reply));

        ForumTopicDetail result = getForumTopicByIdUseCase.execute(TOPIC_ID);

        assertThat(result.topic().getTitle()).isEqualTo("Tópico de teste");
        assertThat(result.replies()).hasSize(1);
        assertThat(result.replies().get(0).getTextContent()).isEqualTo("Resposta");
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando tópico não existe")
    void deveLancarExcecaoQuandoTopicoNaoExiste() {
        when(forumRepository.findById(TOPIC_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> getForumTopicByIdUseCase.execute(TOPIC_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
