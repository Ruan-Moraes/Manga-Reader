package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import({CommentRepositoryAdapter.class, MongoTestContainerConfig.class})
@DisplayName("CommentRepositoryAdapter — Integração MongoDB")
class CommentRepositoryAdapterTest {

    @Autowired
    private CommentRepositoryPort commentRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private Comment rootComment1;
    private Comment rootComment2;
    private Comment replyToRoot1;
    private Comment otherTitleComment;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection(Comment.class);

        rootComment1 = mongoTemplate.save(Comment.builder()
                .titleId("title-1")
                .userId("user-1")
                .userName("Ruan")
                .textContent("Primeiro comentario root")
                .createdAt(LocalDateTime.of(2024, 1, 1, 10, 0))
                .build());

        rootComment2 = mongoTemplate.save(Comment.builder()
                .titleId("title-1")
                .userId("user-2")
                .userName("Maria")
                .textContent("Segundo comentario root")
                .createdAt(LocalDateTime.of(2024, 1, 2, 10, 0))
                .build());

        replyToRoot1 = mongoTemplate.save(Comment.builder()
                .titleId("title-1")
                .parentCommentId(rootComment1.getId())
                .userId("user-3")
                .userName("Carlos")
                .textContent("Resposta ao primeiro")
                .createdAt(LocalDateTime.of(2024, 1, 3, 10, 0))
                .build());

        otherTitleComment = mongoTemplate.save(Comment.builder()
                .titleId("title-2")
                .userId("user-1")
                .userName("Ruan")
                .textContent("Comentario em outro titulo")
                .createdAt(LocalDateTime.of(2024, 1, 4, 10, 0))
                .build());
    }

    @Nested
    @DisplayName("findByTitleId")
    class FindByTitleId {

        @Test
        @DisplayName("Deve retornar todos os comentários do título")
        void deveRetornarComentariosDoTitulo() {
            var result = commentRepository.findByTitleId("title-1");
            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("Deve retornar página de comentários do título")
        void deveRetornarPaginaDeComentarios() {
            var page = commentRepository.findByTitleId("title-1", PageRequest.of(0, 2));
            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve retornar vazio para título sem comentários")
        void deveRetornarVazioParaTituloSemComentarios() {
            var result = commentRepository.findByTitleId("title-inexistente");
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByTitleIdAndParentCommentIdIsNull")
    class FindByTitleIdAndParentCommentIdIsNull {

        @Test
        @DisplayName("Deve retornar apenas comentários root do título")
        void deveRetornarApenasComentariosRoot() {
            var result = commentRepository.findByTitleIdAndParentCommentIdIsNull("title-1");
            assertThat(result).hasSize(2)
                    .extracting(Comment::getTextContent)
                    .containsExactlyInAnyOrder("Primeiro comentario root", "Segundo comentario root");
        }
    }

    @Nested
    @DisplayName("findByParentCommentId")
    class FindByParentCommentId {

        @Test
        @DisplayName("Deve retornar respostas de um comentário")
        void deveRetornarRespostasDeUmComentario() {
            var result = commentRepository.findByParentCommentId(rootComment1.getId());
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTextContent()).isEqualTo("Resposta ao primeiro");
        }

        @Test
        @DisplayName("Deve retornar vazio quando não há respostas")
        void deveRetornarVazioQuandoNaoHaRespostas() {
            var result = commentRepository.findByParentCommentId(rootComment2.getId());
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar comentário quando ID existe")
        void deveRetornarComentarioQuandoIdExiste() {
            var result = commentRepository.findById(rootComment1.getId());
            assertThat(result).isPresent();
            assertThat(result.get().getTextContent()).isEqualTo("Primeiro comentario root");
        }

        @Test
        @DisplayName("Deve retornar empty quando ID não existe")
        void deveRetornarEmptyQuandoIdNaoExiste() {
            var result = commentRepository.findById("id-inexistente");
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo comentário e gerar ID")
        void devePersistirNovoComentario() {
            var newComment = Comment.builder()
                    .titleId("title-1")
                    .userId("user-5")
                    .userName("Ana")
                    .textContent("Novo comentario")
                    .createdAt(LocalDateTime.now())
                    .build();

            var saved = commentRepository.save(newComment);

            assertThat(saved.getId()).isNotNull();
            assertThat(saved.getTextContent()).isEqualTo("Novo comentario");
        }

        @Test
        @DisplayName("Deve atualizar comentário existente")
        void deveAtualizarComentarioExistente() {
            rootComment1.setTextContent("Comentario editado");
            commentRepository.save(rootComment1);

            var updated = commentRepository.findById(rootComment1.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getTextContent()).isEqualTo("Comentario editado");
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover o comentário")
        void deveRemoverComentario() {
            commentRepository.deleteById(otherTitleComment.getId());
            assertThat(commentRepository.findById(otherTitleComment.getId())).isEmpty();
        }
    }
}
