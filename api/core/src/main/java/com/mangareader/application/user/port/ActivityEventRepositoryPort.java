package com.mangareader.application.user.port;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.user.entity.ActivityEvent;

/**
 * Port de saída — acesso a dados do feed de atividades (MongoDB).
 */
public interface ActivityEventRepositoryPort {
    ActivityEvent save(ActivityEvent event);

    Page<ActivityEvent> findVisibleByUserId(String userId, Pageable pageable);

    List<ActivityEvent> findAllByUserId(String userId);

    /**
     * Marca um evento como oculto, desde que pertença ao usuário informado.
     *
     * @return {@code true} se algum documento foi alterado (evento existe e é do usuário)
     */
    boolean hide(String eventId, String userId);

    void deleteAllByUserId(String userId);
}
