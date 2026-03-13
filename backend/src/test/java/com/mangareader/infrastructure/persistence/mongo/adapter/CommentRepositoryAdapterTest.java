package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.infrastructure.persistence.mongo.repository.CommentMongoRepository;

@DataMongoTest
@Testcontainers
@ActiveProfiles("test")
@Import(CommentRepositoryAdapter.class)
@DisplayName("CommentRepositoryAdapter — Integração MongoDB")
class CommentRepositoryAdapterTest {

    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:8.0");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    @Autowired
    private CommentRepositoryPort commentRepository;

    @Autowired
    private CommentMongoRepository mongoRepository;

    private Comment rootComment1;
    private Comment rootComment2;
    private Comment reply1;
    private Comment otherTitleComment;

    @BeforeEach
    void setUp() {
        mongoRepository.deleteAll();

        rootComment1 = mongoRepository.save(Comment.builder()
                .titleId("title-1")
                .userId("user-1")
                .userName("Ruan")
                .textContent("Ótimo mangá!")
                .likeCount(5)
                .build());

        rootComment2 = mongoRepository.save(Comment.builder()
                .titleId("title-1")
                .userId("user-2")
                .userName("Maria")
                .textContent("Concordo, muito bom!")
                .build());

        reply1 = mongoRepository.save(Comment.builder()
                .titleId("title-1")
                .parentCommentId(rootComment1.getId())
                .userId("user-3")
                .userName("Pedro")
                .textContent("Também achei!")
                .build());

        otherTitleComment = mongoRepository.save(Comment.builder()
                .titleId("title-2")
                .userId("user-1")
                .userName("Ruan")
                .textContent("Este também é bom")
                .build());
    }

    @Nested
    @DisplayName("findByTitleId")
    class FindByTitleId {

        @Test
        @DisplayName("Deve retornar todos os comentários de um título")
        void deveRetornarComentariosDoTitulo() {
            var result = commentRepository.findByTitleId("title-1");

            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("Deve retornar lista vazia para título sem comentários")
        void deveRetornarListaVaziaParaTituloSemComentarios() {
            assertThat(commentRepository.findByTitleId("nonexistent")).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar paginado por título")
        void deveRetornarPaginadoPorTitulo() {
            var page = commentRepository.findByTitleId("title-1", PageRequest.of(0, 2));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("findByTitleIdAndParentCommentIdIsNull")
    class FindRootComments {

        @Test
        @DisplayName("Deve retornar apenas comentários raiz (sem parentCommentId)")
        void deveRetornarApenasComentariosRaiz() {
            var result = commentRepository.findByTitleIdAndParentCommentIdIsNull("title-1");

            assertThat(result).hasSize(2);
            assertThat(result).extracting(Comment::getTextContent)
                    .containsExactlyInAnyOrder("Ótimo mangá!", "Concordo, muito bom!");
        }
    }

    @Nested
    @DisplayName("findByParentCommentId")
    class FindReplies {

        @Test
        @DisplayName("Deve retornar respostas de um comentário")
        void deveRetornarRespostasDeUmComentario() {
            var result = commentRepository.findByParentCommentId(rootComment1.getId());

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUserName()).isEqualTo("Pedro");
        }

        @Test
        @DisplayName("Deve retornar lista vazia para comentário sem respostas")
        void deveRetornarListaVaziaParaComentarioSemRespostas() {
            assertThat(commentRepository.findByParentCommentId(rootComment2.getId())).isEmpty();
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar comentário pelo ID")
        void deveRetornarComentarioPeloId() {
            var result = commentRepository.findById(rootComment1.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getTextContent()).isEqualTo("Ótimo mangá!");
            assertThat(result.get().getLikeCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("Deve retornar empty para ID inexistente")
        void deveRetornarEmptyParaIdInexistente() {
            assertThat(commentRepository.findById("nonexistent")).isEmpty();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo comentário")
        void devePersistirNovoComentario() {
            var newComment = commentRepository.save(Comment.builder()
                    .titleId("title-1")
                    .userId("user-4")
                    .userName("Ana")
                    .textContent("Novo comentário!")
                    .build());

            assertThat(newComment.getId()).isNotNull();
            assertThat(commentRepository.findByTitleId("title-1")).hasSize(4);
        }

        @Test
        @DisplayName("Deve atualizar comentário existente")
        void deveAtualizarComentarioExistente() {
            rootComment1.setTextContent("Texto editado");
            rootComment1.setWasEdited(true);
            commentRepository.save(rootComment1);

            var updated = commentRepository.findById(rootComment1.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getTextContent()).isEqualTo("Texto editado");
            assertThat(updated.get().isWasEdited()).isTrue();
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover comentário pelo ID")
        void deveRemoverComentarioPeloId() {
            commentRepository.deleteById(rootComment1.getId());

            assertThat(commentRepository.findById(rootComment1.getId())).isEmpty();
            assertThat(commentRepository.findByTitleId("title-1")).hasSize(2);
        }
    }
}
