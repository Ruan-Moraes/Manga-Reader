package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.publisher.entity.PublisherAlias;

public interface PublisherAliasJpaRepository extends JpaRepository<PublisherAlias, Long> {
    @Query("SELECT pa FROM PublisherAlias pa JOIN FETCH pa.publisher WHERE pa.publisher.id IN :publisherIds")
    List<PublisherAlias> findByPublisherIdIn(@Param("publisherIds") Collection<Long> publisherIds);
}
