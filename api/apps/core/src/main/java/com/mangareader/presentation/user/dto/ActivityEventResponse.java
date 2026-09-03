package com.mangareader.presentation.user.dto;

import com.mangareader.domain.user.entity.ActivityEvent;

/**
 * {@code payload} é serializado a partir do tipo concreto em tempo de
 * execução (Jackson resolve pelo objeto real, não pela declaração de
 * interface) — cada {@code type} carrega os campos do seu próprio payload,
 * sem precisar de um mapeador manual por tipo.
 */
public record ActivityEventResponse(
        String id,
        String type,
        Object payload,
        String occurredAt
) {
    public static ActivityEventResponse from(ActivityEvent event) {
        return new ActivityEventResponse(
                event.getId(),
                event.getType().name(),
                event.getPayload(),
                event.getOccurredAt() != null ? event.getOccurredAt().toString() : null
        );
    }
}
