package com.mangareader.domain.subscription.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Plano de assinatura disponível na plataforma (PostgreSQL).
 * <p>
 * O preço é armazenado em centavos de BRL para evitar aritmética de ponto
 * flutuante (ex.: R$19,90 = 1990, R$0,39 = 39).
 */
@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, unique = true)
    private SubscriptionPeriod period;

    /** Preço em centavos BRL (ex.: 1990 = R$19,90). */
    @Column(name = "price_in_cents", nullable = false)
    private long priceInCents;

    @Column(nullable = false, length = 300)
    private String description;

    /**
     * Lista de funcionalidades inclusas no plano.
     * Armazenada como JSONB para flexibilidade sem migrations extras.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> features = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
