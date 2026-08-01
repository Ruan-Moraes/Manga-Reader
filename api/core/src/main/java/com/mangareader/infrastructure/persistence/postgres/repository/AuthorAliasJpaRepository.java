package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.author.entity.AuthorAlias;

public interface AuthorAliasJpaRepository extends JpaRepository<AuthorAlias, Long> {
    @Query("SELECT aa FROM AuthorAlias aa JOIN FETCH aa.author WHERE aa.author.id IN :authorIds")
    List<AuthorAlias> findByAuthorIdIn(@Param("authorIds") Collection<Long> authorIds);
}
