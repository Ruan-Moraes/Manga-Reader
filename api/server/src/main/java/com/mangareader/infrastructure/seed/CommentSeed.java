package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.infrastructure.persistence.mongo.repository.CommentMongoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class CommentSeed implements EntitySeeder {
    private final CommentMongoRepository commentRepository;

    @Override
    public int getOrder() {
        return 3;
    }

    @Override
    public void seed() {
        if (commentRepository.count() > 0) {
            log.info("Comentários já existem — seed de comments ignorado.");

            return;
        }

        var comments = List.of(
                Comment.builder().id("c-1-1").targetType(CommentTarget.TITLE).targetId("1").parentCommentId(null)
                        .userId("seed-user-3").userName("Carlos Henrique").userPhoto("https://i.pravatar.cc/100?img=15")
                        .isHighlighted(true).textContent("A arte desse mangá é absurda! Cada painel parece uma pintura. Não consigo parar de ler.")
                        .upvotes(24).downvotes(1).build(),
                Comment.builder().id("c-1-2").targetType(CommentTarget.TITLE).targetId("1").parentCommentId("c-1-1")
                        .userId("seed-user-1").userName("Leitor Demo").userPhoto("https://i.pravatar.cc/100?img=32")
                        .textContent("Concordo totalmente! O capítulo 5 foi o melhor até agora.")
                        .upvotes(8).downvotes(0).build(),
                Comment.builder().id("c-1-3").targetType(CommentTarget.TITLE).targetId("1").parentCommentId(null)
                        .userId("seed-user-5").userName("Rui Oliveira").userPhoto("https://i.pravatar.cc/100?img=33")
                        .edited(true).textContent("Achei o ritmo um pouco lento nos primeiros capítulos, mas depois melhora muito.")
                        .upvotes(12).downvotes(3).build(),
                Comment.builder().id("c-1-4").targetType(CommentTarget.TITLE).targetId("1").parentCommentId("c-1-3")
                        .userId("seed-user-7").userName("João Pedro").userPhoto("https://i.pravatar.cc/100?img=52")
                        .textContent("Vale a pena a paciência. O clímax é épico.")
                        .upvotes(15).downvotes(0).build(),
                Comment.builder().id("c-2-1").targetType(CommentTarget.TITLE).targetId("2").parentCommentId(null)
                        .userId("seed-user-7").userName("João Pedro").userPhoto("https://i.pravatar.cc/100?img=52")
                        .textContent("Manhwa com premissa incrível! A mistura de medieval com sci-fi funciona demais.")
                        .upvotes(18).downvotes(2).build(),
                Comment.builder().id("c-2-2").targetType(CommentTarget.TITLE).targetId("2").parentCommentId(null)
                        .userId("seed-user-2").userName("Mika Tanaka").userPhoto("https://i.pravatar.cc/100?img=11")
                        .textContent("Os torneios clandestinos são o ponto alto. Muita adrenalina!")
                        .upvotes(14).downvotes(0).build(),
                Comment.builder().id("c-3-1").targetType(CommentTarget.TITLE).targetId("3").parentCommentId(null)
                        .userId("seed-user-6").userName("Ester Nakamura").userPhoto("https://i.pravatar.cc/100?img=44")
                        .isHighlighted(true).textContent("Suspense urbano bem construído. A protagonista é muito carismática.")
                        .upvotes(20).downvotes(1).build(),
                Comment.builder().id("c-3-2").targetType(CommentTarget.TITLE).targetId("3").parentCommentId("c-3-1")
                        .userId("seed-user-1").userName("Leitor Demo").userPhoto("https://i.pravatar.cc/100?img=32")
                        .textContent("Sim! A cena do capítulo 4 me deixou sem fôlego.")
                        .upvotes(9).downvotes(0).build(),
                Comment.builder().id("c-5-1").targetType(CommentTarget.TITLE).targetId("5").parentCommentId(null)
                        .userId("seed-user-5").userName("Rui Oliveira").userPhoto("https://i.pravatar.cc/100?img=33")
                        .textContent("Artes marciais + drama pesado = combinação perfeita. Nota 10!")
                        .upvotes(22).downvotes(0).build(),
                Comment.builder().id("c-1-5").targetType(CommentTarget.TITLE).targetId("1").parentCommentId("c-1-2")
                        .userId("seed-user-3").userName("Carlos Henrique").userPhoto("https://i.pravatar.cc/100?img=15")
                        .textContent("Sim! E o capítulo 7 superou tudo. O clímax da batalha foi insano.")
                        .upvotes(6).downvotes(0).build()
        );

        // Datas explícitas: seed usa id fixo → não é "new" → a auditoria Mongo
        // (@CreatedDate) não dispara. Espalha a criação no passado; editados ganham updatedAt posterior.
        var now = java.time.LocalDateTime.now();
        for (int i = 0; i < comments.size(); i++) {
            Comment c = comments.get(i);
            var createdAt = now.minusDays((i * 3L) + 1L).minusHours(i);
            c.setCreatedAt(createdAt);
            c.setUpdatedAt(c.isEdited() ? createdAt.plusDays(1L) : createdAt);
        }

        commentRepository.saveAll(comments);

        log.info("✓ {} comentários de demonstração criados.", comments.size());
    }
}
