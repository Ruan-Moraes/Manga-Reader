package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.comment.entity.Comment;
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
                Comment.builder().id("c-1-1").titleId("1").parentCommentId(null)
                        .userId("seed-user-3").userName("Carlos Henrique").userPhoto("https://i.pravatar.cc/100?img=15")
                        .isHighlighted(true).textContent("A arte desse mangá é absurda! Cada painel parece uma pintura. Não consigo parar de ler.")
                        .likeCount(24).dislikeCount(1).build(),
                Comment.builder().id("c-1-2").titleId("1").parentCommentId("c-1-1")
                        .userId("seed-user-1").userName("Leitor Demo").userPhoto("https://i.pravatar.cc/100?img=32")
                        .textContent("Concordo totalmente! O capítulo 5 foi o melhor até agora.")
                        .likeCount(8).dislikeCount(0).build(),
                Comment.builder().id("c-1-3").titleId("1").parentCommentId(null)
                        .userId("seed-user-5").userName("Rui Oliveira").userPhoto("https://i.pravatar.cc/100?img=33")
                        .wasEdited(true).textContent("Achei o ritmo um pouco lento nos primeiros capítulos, mas depois melhora muito.")
                        .likeCount(12).dislikeCount(3).build(),
                Comment.builder().id("c-1-4").titleId("1").parentCommentId("c-1-3")
                        .userId("seed-user-7").userName("João Pedro").userPhoto("https://i.pravatar.cc/100?img=52")
                        .textContent("Vale a pena a paciência. O clímax é épico.")
                        .likeCount(15).dislikeCount(0).build(),
                Comment.builder().id("c-2-1").titleId("2").parentCommentId(null)
                        .userId("seed-user-7").userName("João Pedro").userPhoto("https://i.pravatar.cc/100?img=52")
                        .textContent("Manhwa com premissa incrível! A mistura de medieval com sci-fi funciona demais.")
                        .likeCount(18).dislikeCount(2).build(),
                Comment.builder().id("c-2-2").titleId("2").parentCommentId(null)
                        .userId("seed-user-2").userName("Mika Tanaka").userPhoto("https://i.pravatar.cc/100?img=11")
                        .textContent("Os torneios clandestinos são o ponto alto. Muita adrenalina!")
                        .likeCount(14).dislikeCount(0).build(),
                Comment.builder().id("c-3-1").titleId("3").parentCommentId(null)
                        .userId("seed-user-6").userName("Ester Nakamura").userPhoto("https://i.pravatar.cc/100?img=44")
                        .isHighlighted(true).textContent("Suspense urbano bem construído. A protagonista é muito carismática.")
                        .likeCount(20).dislikeCount(1).build(),
                Comment.builder().id("c-3-2").titleId("3").parentCommentId("c-3-1")
                        .userId("seed-user-1").userName("Leitor Demo").userPhoto("https://i.pravatar.cc/100?img=32")
                        .textContent("Sim! A cena do capítulo 4 me deixou sem fôlego.")
                        .likeCount(9).dislikeCount(0).build(),
                Comment.builder().id("c-5-1").titleId("5").parentCommentId(null)
                        .userId("seed-user-5").userName("Rui Oliveira").userPhoto("https://i.pravatar.cc/100?img=33")
                        .textContent("Artes marciais + drama pesado = combinação perfeita. Nota 10!")
                        .likeCount(22).dislikeCount(0).build(),
                Comment.builder().id("c-1-5").titleId("1").parentCommentId("c-1-2")
                        .userId("seed-user-3").userName("Carlos Henrique").userPhoto("https://i.pravatar.cc/100?img=15")
                        .textContent("Sim! E o capítulo 7 superou tudo. O clímax da batalha foi insano.")
                        .likeCount(6).dislikeCount(0).build()
        );

        commentRepository.saveAll(comments);

        log.info("✓ {} comentários de demonstração criados.", comments.size());
    }
}
