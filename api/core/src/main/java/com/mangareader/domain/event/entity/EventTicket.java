package com.mangareader.domain.event.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tipo de ingresso de um evento (PostgreSQL).
 * <p>
 * Compatível com o frontend ({@code TicketType} em event.types.ts).
 */
@Entity
@Table(name = "event_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 100)
    private String name;

    /** Preço em centavos (inteiro). Mesma convenção de subscription_plans.price_in_cents. */
    @Column(name = "price_in_cents", nullable = false)
    @Builder.Default
    private long priceInCents = 0;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "BRL";

    @Builder.Default
    private int available = 0;
}
