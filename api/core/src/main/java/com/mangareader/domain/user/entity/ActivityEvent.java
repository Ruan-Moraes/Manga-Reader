package com.mangareader.domain.user.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.domain.user.entity.activity.ActivityPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Evento do feed de atividades do usuário (MongoDB).
 * <p>
 * {@code payload} é declarado como {@link ActivityPayload} (interface) — o
 * Spring Data MongoDB grava o discriminador de tipo concreto ({@code _class})
 * automaticamente, permitindo que cada {@code type} carregue um payload
 * próprio sem um campo genérico/mapa. {@code hidden} é um soft-delete: o
 * evento permanece no histórico, mas deixa de aparecer no feed do próprio
 * usuário.
 */
@Document(collection = "activity_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityEvent {
    @Id
    private String id;

    private String userId;

    private ActivityEventType type;

    private ActivityPayload payload;

    @CreatedDate
    private LocalDateTime occurredAt;

    @Builder.Default
    private boolean hidden = false;
}
