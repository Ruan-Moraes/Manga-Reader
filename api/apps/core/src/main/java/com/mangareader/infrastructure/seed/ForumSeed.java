package com.mangareader.infrastructure.seed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;
import com.mangareader.infrastructure.persistence.mongo.repository.CommentMongoRepository;
import com.mangareader.infrastructure.persistence.mongo.repository.ForumTopicMongoRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Seed do fórum (MongoDB): tópicos em {@code forum_topics}; respostas são
 * comentários unificados ({@code comments}, targetType=FORUM_TOPIC) com
 * {@code isHighlighted} marcando a melhor resposta.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class ForumSeed implements EntitySeeder {
    private final ForumTopicMongoRepository forumTopicRepository;
    private final CommentMongoRepository commentRepository;
    private final UserJpaRepository userRepository;

    @Override
    public int getOrder() {
        return 9;
    }

    @Override
    public void seed() {
        if (forumTopicRepository.count() > 0) {
            log.info("Fórum já existe — seed de forum ignorado.");

            return;
        }

        var users = userRepository.findAll();

        if (users.size() < 4) return;

        var demo = users.get(0);
        var mika = users.get(1);
        var carlos = users.get(2);
        var admin = users.get(3);

        List<ForumTopic> topics = new ArrayList<>();
        List<Comment> replies = new ArrayList<>();

        ForumTopic regras = topic("forum-regras", admin,
                "📌 Regras do Fórum — Leia antes de postar",
                "Bem-vindos ao fórum MangaReader! Antes de participar, por favor leia as regras:\n\n1. Respeite todos os membros.\n2. Use tags de spoiler quando necessário.\n3. Não faça spam ou autopromoção.\n4. Contribua de forma construtiva.\n5. Divirta-se!",
                ForumCategory.GERAL, List.of("Regras", "Importante"), 2340, 56);
        regras.setPinned(true);
        topics.add(regras);
        replies.add(reply("forum-regras-r1", regras, demo,
                "Obrigado por organizar as regras! Fórum muito bem moderado.", 12, false));
        replies.add(reply("forum-regras-r2", regras, mika,
                "Excelente! Concordo com todas as regras. 💯", 8, false));

        ForumTopic onePiece = topic("forum-onepiece", carlos,
                "One Piece: o final será satisfatório? [SPOILERS]",
                "Com One Piece se aproximando do arco final, vocês acham que Oda vai conseguir encerrar de forma satisfatória? São tantas tramas abertas...\n\nPessoalmente, estou preocupado com o ritmo dos últimos capítulos.",
                ForumCategory.GERAL, List.of("One Piece", "Discussão", "Spoilers"), 1890, 43);
        topics.add(onePiece);
        replies.add(reply("forum-onepiece-r1", onePiece, demo,
                "Eu confio no Oda. Ele sempre surpreende quando menos esperamos.", 15, false));
        replies.add(reply("forum-onepiece-r2", onePiece, mika,
                "Acho que o arco final vai ser longo o suficiente para resolver tudo.", 9, false));
        replies.add(reply("forum-onepiece-r3", onePiece, admin,
                "Lembrem de usar a tag de spoiler nos comentários mais detalhados!", 6, false));

        ForumTopic recomendacao = topic("forum-recomendacao", mika,
                "Recomendem mangás de romance parecidos com Coração de Porcelana",
                "Acabei de ler Coração de Porcelana e estou apaixonada! Alguém conhece outros mangás shoujo com essa vibe de arte delicada e romance lento?",
                ForumCategory.RECOMENDACOES, List.of("Romance", "Shoujo", "Recomendação"), 567, 28);
        recomendacao.setSolved(true);
        topics.add(recomendacao);
        replies.add(reply("forum-recomendacao-r1", recomendacao, carlos,
                "Tenta ler 'Your Lie in April' se ainda não leu. A arte é linda e a história é emocionante.", 11, false));
        replies.add(reply("forum-recomendacao-r2", recomendacao, demo,
                "Fruits Basket (edição completa) é perfeito para esse estilo!", 14, true));

        ForumTopic teoria = topic("forum-teoria", demo,
                "Teoria: o verdadeiro poder da Armadura Negra em Reino de Aço",
                "Tenho uma teoria sobre a Armadura Negra baseada nos capítulos 5-8. O sangue do protagonista não apenas desperta a armadura, mas pode estar conectado a algo muito maior...\n\nAlguém mais percebeu a semelhança entre os símbolos da forja ancestral e os brasões do capítulo 3?",
                ForumCategory.TEORIAS, List.of("Reino de Aço", "Teoria", "Spoilers"), 423, 35);
        topics.add(teoria);
        replies.add(reply("forum-teoria-r1", teoria, carlos,
                "Cara, eu pensei a mesma coisa! Os símbolos são idênticos. Acho que o ferreiro é descendente dos antigos forjadores reais.", 20, false));

        ForumTopic suporte = topic("forum-suporte", mika,
                "Como salvar mangás na biblioteca?",
                "Sou nova na plataforma e não estou conseguindo salvar mangás na minha biblioteca. Alguém pode me ajudar?",
                ForumCategory.SUPORTE, List.of("Ajuda", "Biblioteca"), 120, 5);
        suporte.setSolved(true);
        topics.add(suporte);
        replies.add(reply("forum-suporte-r1", suporte, admin,
                "Oi Mika! Na página de qualquer título, clique no botão 'Salvar na Biblioteca' e escolha a lista desejada (Lendo, Quero Ler, Concluído). Se tiver mais dúvidas, é só perguntar!", 7, true));

        // Datas explícitas: seed usa id fixo → não é "new" → auditoria Mongo
        // (@CreatedDate) não dispara. replyCount fechado pela contagem real.
        var now = LocalDateTime.now();
        for (int i = 0; i < topics.size(); i++) {
            ForumTopic t = topics.get(i);
            var createdAt = now.minusDays((i * 4L) + 2L);
            t.setCreatedAt(createdAt);
            t.setLastActivityAt(createdAt.plusHours(6L));
            t.setUpdatedAt(createdAt);
            t.setReplyCount(replies.stream().filter(r -> r.getTargetId().equals(t.getId())).count());
        }
        for (int i = 0; i < replies.size(); i++) {
            Comment r = replies.get(i);
            var createdAt = now.minusDays(1L).minusHours(i);
            r.setCreatedAt(createdAt);
            r.setUpdatedAt(createdAt);
        }

        forumTopicRepository.saveAll(topics);
        commentRepository.saveAll(replies);

        log.info("✓ {} tópicos e {} respostas de fórum criados.", topics.size(), replies.size());
    }

    private static ForumTopic topic(String id, User author, String title, String content,
                                    ForumCategory category, List<String> tags, int viewCount, long upvotes) {
        return ForumTopic.builder()
                .id(id)
                .authorId(author.getId().toString())
                .authorName(author.getName())
                .authorPhoto(author.getPhotoUrl())
                .title(title)
                .content(content)
                .category(category)
                .tags(tags)
                .viewCount(viewCount)
                .upvotes(upvotes)
                .build();
    }

    private static Comment reply(String id, ForumTopic topic, User author, String content,
                                 long upvotes, boolean bestAnswer) {
        return Comment.builder()
                .id(id)
                .targetType(CommentTarget.FORUM_TOPIC)
                .targetId(topic.getId())
                .userId(author.getId().toString())
                .userName(author.getName())
                .userPhoto(author.getPhotoUrl())
                .textContent(content)
                .upvotes(upvotes)
                .isHighlighted(bestAnswer)
                .build();
    }
}
