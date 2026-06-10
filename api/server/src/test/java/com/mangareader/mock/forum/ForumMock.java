package com.mangareader.mock.forum;

import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;
import com.mangareader.mock.user.UserMock;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Mocks do fórum no modelo unificado: tópico Mongo com autor em snapshot;
 * respostas são comentários ({@code targetType=FORUM_TOPIC}).
 */
public final class ForumMock {

    private ForumMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final String TOPIC_1_ID = "30000000-0000-0000-0000-000000000001";
    public static final String TOPIC_2_ID = "30000000-0000-0000-0000-000000000002";
    public static final String TOPIC_3_ID = "30000000-0000-0000-0000-000000000003";
    public static final String TOPIC_4_ID = "30000000-0000-0000-0000-000000000004";
    public static final String TOPIC_5_ID = "30000000-0000-0000-0000-000000000005";

    // ── Replies (comments targetType=FORUM_TOPIC) ──────────────────────────

    public static Comment simpleReply(ForumTopic topic, User author, String content) {
        return Comment.builder()
                .id(UUID.randomUUID().toString())
                .targetType(CommentTarget.FORUM_TOPIC)
                .targetId(topic.getId())
                .userId(author.getId().toString())
                .userName(author.getName())
                .userPhoto(author.getPhotoUrl())
                .textContent(content)
                .build();
    }

    public static Comment bestAnswerReply(ForumTopic topic, User author) {
        return Comment.builder()
                .id(UUID.randomUUID().toString())
                .targetType(CommentTarget.FORUM_TOPIC)
                .targetId(topic.getId())
                .userId(author.getId().toString())
                .userName(author.getName())
                .userPhoto(author.getPhotoUrl())
                .textContent("Essa e a resposta marcada como melhor. Voce precisa instalar o Java 23 e executar mvn spring-boot:run.")
                .isHighlighted(true)
                .upvotes(15)
                .build();
    }

    public static Comment editedReply(ForumTopic topic, User author) {
        return Comment.builder()
                .id(UUID.randomUUID().toString())
                .targetType(CommentTarget.FORUM_TOPIC)
                .targetId(topic.getId())
                .userId(author.getId().toString())
                .userName(author.getName())
                .userPhoto(author.getPhotoUrl())
                .textContent("(Editado) Corrigi a informacao anterior. A versao correta e a 3.4.3.")
                .edited(true)
                .upvotes(3)
                .build();
    }

    // ── Topics ─────────────────────────────────────────────────────────────

    private static ForumTopic.ForumTopicBuilder topicBuilder(String id, User author) {
        return ForumTopic.builder()
                .id(id)
                .authorId(author.getId().toString())
                .authorName(author.getName())
                .authorPhoto(author.getPhotoUrl());
    }

    public static ForumTopic discussionTopic() {
        return topicBuilder(TOPIC_1_ID, UserMock.reader())
                .title("Qual o melhor manga de 2025 ate agora?")
                .content("Quero saber a opiniao de voces. Pra mim, Cronicas de Polaris esta imbativel.")
                .category(ForumCategory.GERAL)
                .tags(new ArrayList<>(List.of("manga", "2025", "ranking")))
                .viewCount(320)
                .replyCount(12)
                .upvotes(28)
                .build();
    }

    public static ForumTopic questionTopic() {
        return topicBuilder(TOPIC_2_ID, UserMock.poster())
                .title("Como configurar o ambiente de desenvolvimento?")
                .content("Estou tentando rodar o projeto localmente mas nao consigo configurar o Docker.")
                .category(ForumCategory.SUPORTE)
                .tags(new ArrayList<>(List.of("docker", "setup", "dev")))
                .viewCount(150)
                .replyCount(5)
                .upvotes(8)
                .isSolved(true)
                .build();
    }

    public static ForumTopic pinnedTopic() {
        return topicBuilder(TOPIC_3_ID, UserMock.admin())
                .title("Regras do forum - leia antes de postar")
                .content("1. Sem spoilers sem tag\n2. Respeite outros membros\n3. Sem spam ou auto-promocao")
                .category(ForumCategory.NOTICIAS)
                .tags(new ArrayList<>(List.of("regras", "importante")))
                .viewCount(5000)
                .replyCount(0)
                .upvotes(150)
                .isPinned(true)
                .isLocked(true)
                .build();
    }

    public static ForumTopic reviewTopic() {
        return topicBuilder(TOPIC_4_ID, UserMock.moderator())
                .title("Review: Flores de Neon - Vale a pena ler?")
                .content("Acabei de terminar Flores de Neon e quero compartilhar minha opiniao detalhada.")
                .category(ForumCategory.RECOMENDACOES)
                .tags(new ArrayList<>(List.of("review", "Flores de Neon", "manhua")))
                .viewCount(85)
                .replyCount(3)
                .upvotes(12)
                .build();
    }

    public static ForumTopic emptyTopic() {
        return topicBuilder(TOPIC_5_ID, UserMock.withoutBio())
                .title("Alguem mais leu Coracao de Porcelana?")
                .content("Comecei a ler ontem mas nao achei ninguem discutindo.")
                .category(ForumCategory.GERAL)
                .tags(new ArrayList<>())
                .viewCount(5)
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<ForumTopic> allTopics() {
        return List.of(discussionTopic(), questionTopic(), pinnedTopic(),
                reviewTopic(), emptyTopic());
    }

    public static List<ForumTopic> byCategory(ForumCategory category) {
        return allTopics().stream()
                .filter(t -> t.getCategory() == category)
                .toList();
    }

    public static List<Comment> repliesFor(ForumTopic topic) {
        return List.of(
                simpleReply(topic, UserMock.moderator(), "Concordo com Polaris, mas Reino de Aco tambem esta excelente."),
                bestAnswerReply(topic, UserMock.admin()));
    }
}
