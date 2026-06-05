package com.mangareader.mock.comment;

import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.mock.title.TitleMock;
import com.mangareader.mock.user.UserMock;

import java.time.LocalDateTime;
import java.util.List;

public final class CommentMock {

    private CommentMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final String COMMENT_1_ID = "comment-1";
    public static final String COMMENT_2_ID = "comment-2";
    public static final String COMMENT_3_ID = "comment-3";
    public static final String REPLY_1_ID   = "reply-1";
    public static final String REPLY_2_ID   = "reply-2";

    // ── Root comments ──────────────────────────────────────────────────────

    public static Comment rootComment() {
        return Comment.builder()
                .id(COMMENT_1_ID)
                .titleId(TitleMock.TITLE_1_ID)
                .userId(UserMock.READER_ID.toString())
                .userName("Leitor Demo")
                .userPhoto("https://i.pravatar.cc/100?img=32")
                .textContent("Esse mangá é incrível! A arte do capítulo 5 me deixou sem palavras.")
                .likeCount(12)
                .dislikeCount(1)
                .createdAt(LocalDateTime.of(2025, 1, 10, 14, 30))
                .build();
    }

    public static Comment highlightedComment() {
        return Comment.builder()
                .id(COMMENT_2_ID)
                .titleId(TitleMock.TITLE_1_ID)
                .userId(UserMock.ADMIN_ID.toString())
                .userName("Ana Beatriz")
                .userPhoto("https://i.pravatar.cc/100?img=21")
                .isHighlighted(true)
                .textContent("Comentário fixado: Novo capítulo sai toda segunda-feira!")
                .likeCount(45)
                .dislikeCount(0)
                .createdAt(LocalDateTime.of(2025, 1, 5, 10, 0))
                .build();
    }

    public static Comment editedComment() {
        return Comment.builder()
                .id(COMMENT_3_ID)
                .titleId(TitleMock.TITLE_2_ID)
                .userId(UserMock.MOD_ID.toString())
                .userName("Sakura Mendes")
                .userPhoto("https://i.pravatar.cc/100?img=19")
                .wasEdited(true)
                .textContent("Editado: Achei o plot twist do cap 10 bem previsível, mas a execução salvou.")
                .likeCount(8)
                .dislikeCount(3)
                .createdAt(LocalDateTime.of(2025, 1, 20, 16, 0))
                .build();
    }

    public static Comment withImage() {
        return Comment.builder()
                .id("comment-img")
                .titleId(TitleMock.TITLE_3_ID)
                .userId(UserMock.POSTER_ID.toString())
                .userName("Haru Yamamoto")
                .userPhoto("https://i.pravatar.cc/100?img=35")
                .textContent("Olha essa cena!")
                .imageContent("https://picsum.photos/400/300?random=50")
                .likeCount(20)
                .dislikeCount(0)
                .createdAt(LocalDateTime.of(2025, 2, 1, 12, 0))
                .build();
    }

    public static Comment withNoLikes() {
        return Comment.builder()
                .id("comment-no-likes")
                .titleId(TitleMock.TITLE_4_ID)
                .userId(UserMock.INACTIVE_ID.toString())
                .userName("Novo Usuario")
                .textContent("Primeiro comentário aqui.")
                .likeCount(0)
                .dislikeCount(0)
                .createdAt(LocalDateTime.of(2025, 3, 1, 8, 0))
                .build();
    }

    public static Comment controversial() {
        return Comment.builder()
                .id("comment-controversial")
                .titleId(TitleMock.TITLE_1_ID)
                .userId(UserMock.POSTER_ID.toString())
                .userName("Haru Yamamoto")
                .userPhoto("https://i.pravatar.cc/100?img=35")
                .textContent("Unpopular opinion: o protagonista é o pior personagem da obra.")
                .likeCount(30)
                .dislikeCount(28)
                .createdAt(LocalDateTime.of(2025, 2, 15, 20, 0))
                .build();
    }

    // ── Replies ─────────────────────────────────────────────────────────────

    public static Comment reply() {
        return Comment.builder()
                .id(REPLY_1_ID)
                .titleId(TitleMock.TITLE_1_ID)
                .parentCommentId(COMMENT_1_ID)
                .userId(UserMock.MOD_ID.toString())
                .userName("Sakura Mendes")
                .userPhoto("https://i.pravatar.cc/100?img=19")
                .textContent("Concordo totalmente! O capítulo 5 é o melhor até agora.")
                .likeCount(5)
                .dislikeCount(0)
                .createdAt(LocalDateTime.of(2025, 1, 10, 15, 0))
                .build();
    }

    public static Comment nestedReply() {
        return Comment.builder()
                .id(REPLY_2_ID)
                .titleId(TitleMock.TITLE_1_ID)
                .parentCommentId(REPLY_1_ID)
                .userId(UserMock.READER_ID.toString())
                .userName("Leitor Demo")
                .userPhoto("https://i.pravatar.cc/100?img=32")
                .textContent("Obrigado! Mal posso esperar pelo próximo.")
                .likeCount(2)
                .dislikeCount(0)
                .createdAt(LocalDateTime.of(2025, 1, 10, 15, 30))
                .build();
    }

    // ── Factory ─────────────────────────────────────────────────────────────

    public static Comment forTitle(String titleId, String userId, String userName, String text) {
        return Comment.builder()
                .titleId(titleId)
                .userId(userId)
                .userName(userName)
                .textContent(text)
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<Comment> rootComments() {
        return List.of(rootComment(), highlightedComment(), editedComment(),
                withImage(), withNoLikes(), controversial());
    }

    public static List<Comment> withReplies() {
        return List.of(rootComment(), reply(), nestedReply());
    }

    public static List<Comment> forTitle1() {
        return List.of(rootComment(), highlightedComment(), controversial(),
                reply(), nestedReply());
    }
}
