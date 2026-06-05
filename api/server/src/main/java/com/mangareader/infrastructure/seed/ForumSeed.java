package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.forum.entity.ForumReply;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.infrastructure.persistence.postgres.repository.ForumTopicJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class ForumSeed implements EntitySeeder {
    private final ForumTopicJpaRepository forumTopicRepository;
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

        var regras = ForumTopic.builder()
                .author(admin)
                .title("📌 Regras do Fórum — Leia antes de postar")
                .content("Bem-vindos ao fórum MangaReader! Antes de participar, por favor leia as regras:\n\n1. Respeite todos os membros.\n2. Use tags de spoiler quando necessário.\n3. Não faça spam ou autopromoção.\n4. Contribua de forma construtiva.\n5. Divirta-se!")
                .category(ForumCategory.GERAL)
                .tags(List.of("Regras", "Importante"))
                .isPinned(true)
                .viewCount(2340).likeCount(56)
                .build();

        regras.getReplies().addAll(List.of(
                ForumReply.builder()
                        .topic(regras).author(demo)
                        .content("Obrigado por organizar as regras! Fórum muito bem moderado.")
                        .likes(12).build(),
                ForumReply.builder()
                        .topic(regras).author(mika)
                        .content("Excelente! Concordo com todas as regras. 💯")
                        .likes(8).build()
        ));
        regras.setReplyCount(2);

        var onePiece = ForumTopic.builder()
                .author(carlos)
                .title("One Piece: o final será satisfatório? [SPOILERS]")
                .content("Com One Piece se aproximando do arco final, vocês acham que Oda vai conseguir encerrar de forma satisfatória? São tantas tramas abertas...\n\nPessoalmente, estou preocupado com o ritmo dos últimos capítulos.")
                .category(ForumCategory.GERAL)
                .tags(List.of("One Piece", "Discussão", "Spoilers"))
                .viewCount(1890).replyCount(3).likeCount(43)
                .build();

        onePiece.getReplies().addAll(List.of(
                ForumReply.builder()
                        .topic(onePiece).author(demo)
                        .content("Eu confio no Oda. Ele sempre surpreende quando menos esperamos.")
                        .likes(15).build(),
                ForumReply.builder()
                        .topic(onePiece).author(mika)
                        .content("Acho que o arco final vai ser longo o suficiente para resolver tudo.")
                        .likes(9).build(),
                ForumReply.builder()
                        .topic(onePiece).author(admin)
                        .content("Lembrem de usar a tag de spoiler nos comentários mais detalhados!")
                        .likes(6).build()
        ));

        var recomendacao = ForumTopic.builder()
                .author(mika)
                .title("Recomendem mangás de romance parecidos com Coração de Porcelana")
                .content("Acabei de ler Coração de Porcelana e estou apaixonada! Alguém conhece outros mangás shoujo com essa vibe de arte delicada e romance lento?")
                .category(ForumCategory.RECOMENDACOES)
                .tags(List.of("Romance", "Shoujo", "Recomendação"))
                .viewCount(567).replyCount(2).likeCount(28)
                .build();

        recomendacao.getReplies().addAll(List.of(
                ForumReply.builder()
                        .topic(recomendacao).author(carlos)
                        .content("Tenta ler 'Your Lie in April' se ainda não leu. A arte é linda e a história é emocionante.")
                        .likes(11).build(),
                ForumReply.builder()
                        .topic(recomendacao).author(demo)
                        .content("Fruits Basket (edição completa) é perfeito para esse estilo!")
                        .likes(14).isBestAnswer(true).build()
        ));
        recomendacao.setSolved(true);

        var teoria = ForumTopic.builder()
                .author(demo)
                .title("Teoria: o verdadeiro poder da Armadura Negra em Reino de Aço")
                .content("Tenho uma teoria sobre a Armadura Negra baseada nos capítulos 5-8. O sangue do protagonista não apenas desperta a armadura, mas pode estar conectado a algo muito maior...\n\nAlguém mais percebeu a semelhança entre os símbolos da forja ancestral e os brasões do capítulo 3?")
                .category(ForumCategory.TEORIAS)
                .tags(List.of("Reino de Aço", "Teoria", "Spoilers"))
                .viewCount(423).replyCount(1).likeCount(35)
                .build();

        teoria.getReplies().add(
                ForumReply.builder()
                        .topic(teoria).author(carlos)
                        .content("Cara, eu pensei a mesma coisa! Os símbolos são idênticos. Acho que o ferreiro é descendente dos antigos forjadores reais.")
                        .likes(20).build()
        );

        var suporte = ForumTopic.builder()
                .author(mika)
                .title("Como salvar mangás na biblioteca?")
                .content("Sou nova na plataforma e não estou conseguindo salvar mangás na minha biblioteca. Alguém pode me ajudar?")
                .category(ForumCategory.SUPORTE)
                .tags(List.of("Ajuda", "Biblioteca"))
                .viewCount(120).replyCount(1).likeCount(5)
                .isSolved(true)
                .build();

        suporte.getReplies().add(
                ForumReply.builder()
                        .topic(suporte).author(admin)
                        .content("Oi Mika! Na página de qualquer título, clique no botão 'Salvar na Biblioteca' e escolha a lista desejada (Lendo, Quero Ler, Concluído). Se tiver mais dúvidas, é só perguntar!")
                        .likes(7).isBestAnswer(true).build()
        );

        forumTopicRepository.saveAll(List.of(regras, onePiece, recomendacao, teoria, suporte));

        log.info("✓ 5 tópicos de fórum de demonstração criados.");
    }
}
