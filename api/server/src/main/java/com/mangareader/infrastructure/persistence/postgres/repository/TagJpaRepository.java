package com.mangareader.infrastructure.persistence.postgres.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.category.entity.Tag;

/**
 * Spring Data JPA Repository para Tags.
 *
 * <p>Pós-Fase B i18n: campo {@code label} é JSONB ({@code LocalizedString}),
 * incompatível com derived queries do Spring Data. Filtros / ordenação /
 * busca por substring são resolvidos no adapter em memória (cardinalidade
 * baixa: dezenas de tags).
 */
public interface TagJpaRepository extends JpaRepository<Tag, Long> {
}
