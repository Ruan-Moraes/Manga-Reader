package com.mangareader.application.forum.port;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;

/**
 * Port de saída — acesso a dados de Forum Topics (MongoDB).
 * <p>
 * Respostas não passam por aqui: são comentários unificados
 * ({@code CommentRepositoryPort}, targetType=FORUM_TOPIC).
 */
public interface ForumRepositoryPort {
    Page<ForumTopic> findAll(Pageable pageable);

    /** Listagem particionada por idioma (UGC). */
    Page<ForumTopic> findByLanguageIn(Collection<String> languages, Pageable pageable);

    Optional<ForumTopic> findById(String id);

    Page<ForumTopic> findByCategory(ForumCategory category, Pageable pageable);

    Page<ForumTopic> findByCategoryAndLanguageIn(ForumCategory category, Collection<String> languages, Pageable pageable);

    ForumTopic save(ForumTopic topic);

    long countByAuthorId(String authorId);

    void deleteById(String id);
}
