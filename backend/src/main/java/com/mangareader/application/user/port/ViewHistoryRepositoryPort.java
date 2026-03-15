package com.mangareader.application.user.port;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.user.entity.ViewHistory;

/**
 * Port de saída — acesso a dados de ViewHistory (MongoDB).
 */
public interface ViewHistoryRepositoryPort {

    Page<ViewHistory> findByUserIdOrderByViewedAtDesc(String userId, Pageable pageable);

    Optional<ViewHistory> findByUserIdAndTitleId(String userId, String titleId);

    ViewHistory save(ViewHistory viewHistory);

    void deleteAllByUserId(String userId);
}
