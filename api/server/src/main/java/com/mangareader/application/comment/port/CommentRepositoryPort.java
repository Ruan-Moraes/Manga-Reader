package com.mangareader.application.comment.port;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;

/**
 * Port de saída — acesso a dados de Comments unificados (MongoDB).
 * <p>
 * Consultas são polimórficas por {@code targetType} + {@code targetId}
 * (obra/título, resenha, tópico de fórum).
 */
public interface CommentRepositoryPort {
    List<Comment> findByTargetTypeAndTargetIdAndParentCommentIdIsNull(CommentTarget targetType, String targetId);

    List<Comment> findByTargetTypeAndTargetId(CommentTarget targetType, String targetId);

    List<Comment> findByParentCommentId(String parentCommentId);

    Optional<Comment> findById(String id);

    Comment save(Comment comment);

    void deleteById(String id);

    Page<Comment> findByTargetTypeAndTargetId(CommentTarget targetType, String targetId, Pageable pageable);

    /** Listagem particionada por idioma (UGC). */
    Page<Comment> findByTargetTypeAndTargetIdAndLanguageIn(
            CommentTarget targetType, String targetId, Collection<String> languages, Pageable pageable);

    Page<Comment> findByUserId(String userId, Pageable pageable);

    long countByUserId(String userId);

    /** Contagem de comentários de um alvo (ex.: replyCount de um tópico de fórum). */
    long countByTargetTypeAndTargetId(CommentTarget targetType, String targetId);

    /** Remove todos os comentários de um alvo (cascata ao excluir o subject, ex.: tópico de fórum). */
    void deleteByTargetTypeAndTargetId(CommentTarget targetType, String targetId);
}
