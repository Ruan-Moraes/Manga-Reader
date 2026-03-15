package com.mangareader.mock.forum;

import com.mangareader.domain.forum.entity.ForumReply;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;
import com.mangareader.mock.user.UserMock;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ForumMock {

    private ForumMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final UUID TOPIC_1_ID = UUID.fromString("30000000-0000-0000-0000-000000000001");
    public static final UUID TOPIC_2_ID = UUID.fromString("30000000-0000-0000-0000-000000000002");
    public static final UUID TOPIC_3_ID = UUID.fromString("30000000-0000-0000-0000-000000000003");
    public static final UUID TOPIC_4_ID = UUID.fromString("30000000-0000-0000-0000-000000000004");
    public static final UUID TOPIC_5_ID = UUID.fromString("30000000-0000-0000-0000-000000000005");

    // ── Replies ────────────────────────────────────────────────────────────

    public static ForumReply simpleReply(ForumTopic topic, User author, String content) {
        return ForumReply.builder()
                .id(UUID.randomUUID())
                .topic(topic)
                .author(author)
                .content(content)
                .build();
    }

    public static ForumReply bestAnswerReply(ForumTopic topic, User author) {
        return ForumReply.builder()
                .id(UUID.randomUUID())
                .topic(topic)
                .author(author)
                .content("Essa e a resposta marcada como melhor. Voce precisa instalar o Java 23 e executar mvn spring-boot:run.")
                .isBestAnswer(true)
                .likes(15)
                .build();
    }

    public static ForumReply editedReply(ForumTopic topic, User author) {
        return ForumReply.builder()
                .id(UUID.randomUUID())
                .topic(topic)
                .author(author)
                .content("(Editado) Corrigi a informacao anterior. A versao correta e a 3.4.3.")
                .isEdited(true)
                .likes(3)
                .build();
    }

    // ── Topics ─────────────────────────────────────────────────────────────

    public static ForumTopic discussionTopic() {
        User author = UserMock.reader();
        ForumTopic topic = ForumTopic.builder()
                .id(TOPIC_1_ID)
                .author(author)
                .title("Qual o melhor manga de 2025 ate agora?")
                .content("Quero saber a opiniao de voces. Pra mim, Cronicas de Polaris esta imbativel.")
                .category(ForumCategory.GERAL)
                .tags(new ArrayList<>(List.of("manga", "2025", "ranking")))
                .viewCount(320)
                .replyCount(12)
                .likeCount(28)
                .replies(new ArrayList<>())
                .build();

        topic.getReplies().add(simpleReply(topic, UserMock.moderator(),
                "Concordo com Polaris, mas Reino de Aco tambem esta excelente."));
        topic.getReplies().add(simpleReply(topic, UserMock.poster(),
                "Pra mim Protocolo Zero leva o titulo."));

        return topic;
    }

    public static ForumTopic questionTopic() {
        User author = UserMock.poster();
        ForumTopic topic = ForumTopic.builder()
                .id(TOPIC_2_ID)
                .author(author)
                .title("Como configurar o ambiente de desenvolvimento?")
                .content("Estou tentando rodar o projeto localmente mas nao consigo configurar o Docker.")
                .category(ForumCategory.SUPORTE)
                .tags(new ArrayList<>(List.of("docker", "setup", "dev")))
                .viewCount(150)
                .replyCount(5)
                .likeCount(8)
                .isSolved(true)
                .replies(new ArrayList<>())
                .build();

        topic.getReplies().add(bestAnswerReply(topic, UserMock.admin()));
        topic.getReplies().add(simpleReply(topic, author, "Funcionou! Obrigado!"));

        return topic;
    }

    public static ForumTopic pinnedTopic() {
        ForumTopic topic = ForumTopic.builder()
                .id(TOPIC_3_ID)
                .author(UserMock.admin())
                .title("Regras do forum - leia antes de postar")
                .content("1. Sem spoilers sem tag\n2. Respeite outros membros\n3. Sem spam ou auto-promocao")
                .category(ForumCategory.NOTICIAS)
                .tags(new ArrayList<>(List.of("regras", "importante")))
                .viewCount(5000)
                .replyCount(0)
                .likeCount(150)
                .isPinned(true)
                .isLocked(true)
                .replies(new ArrayList<>())
                .build();

        return topic;
    }

    public static ForumTopic reviewTopic() {
        User author = UserMock.moderator();
        ForumTopic topic = ForumTopic.builder()
                .id(TOPIC_4_ID)
                .author(author)
                .title("Review: Flores de Neon - Vale a pena ler?")
                .content("Acabei de terminar Flores de Neon e quero compartilhar minha opiniao detalhada.")
                .category(ForumCategory.RECOMENDACOES)
                .tags(new ArrayList<>(List.of("review", "Flores de Neon", "manhua")))
                .viewCount(85)
                .replyCount(3)
                .likeCount(12)
                .replies(new ArrayList<>())
                .build();

        topic.getReplies().add(simpleReply(topic, UserMock.reader(),
                "Obrigado pela review! Vou comecar a ler."));
        topic.getReplies().add(editedReply(topic, UserMock.poster()));

        return topic;
    }

    public static ForumTopic emptyTopic() {
        return ForumTopic.builder()
                .id(TOPIC_5_ID)
                .author(UserMock.withoutBio())
                .title("Alguem mais leu Coracao de Porcelana?")
                .content("Comecei a ler ontem mas nao achei ninguem discutindo.")
                .category(ForumCategory.GERAL)
                .tags(new ArrayList<>())
                .viewCount(5)
                .replyCount(0)
                .likeCount(0)
                .replies(new ArrayList<>())
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<ForumTopic> allTopics() {
        return List.of(discussionTopic(), questionTopic(), pinnedTopic(),
                reviewTopic(), emptyTopic());
    }

    public static List<ForumTopic> pinnedTopics() {
        return List.of(pinnedTopic());
    }

    public static List<ForumTopic> byCategory(ForumCategory category) {
        return allTopics().stream()
                .filter(t -> t.getCategory() == category)
                .toList();
    }

    public static List<ForumTopic> withReplies() {
        return List.of(discussionTopic(), questionTopic(), reviewTopic());
    }
}
