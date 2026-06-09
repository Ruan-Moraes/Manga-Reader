package com.mangareader.application.event.port;

import com.mangareader.domain.event.valueobject.EventOrganizer;

/**
 * Port de saída — resolução de organizadores de evento (PostgreSQL).
 * <p>
 * Após a normalização (BCNF-01), o organizador é entidade própria. Use cases de escrita
 * resolvem o organizador recebido para uma instância gerenciada, deduplicando pela chave
 * externa de negócio para manter os dados consistentes entre os eventos do mesmo organizador.
 */
public interface EventOrganizerRepositoryPort {
    /**
     * Encontra o organizador pela chave externa ({@code organizerId}) e atualiza seus campos,
     * ou cria um novo quando não existe. Retorna {@code null} se {@code organizer} for nulo.
     * Sem chave externa, sempre cria um novo registro (não há como deduplicar).
     */
    EventOrganizer findOrCreate(EventOrganizer organizer);
}
