package com.mangareader.domain.subscription.entity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.infrastructure.persistence.postgres.converter.LocalizedStringJsonConverter;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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

    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = LocalizedStringJsonConverter.class)
    @Column(name = "description_i18n", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private LocalizedString descriptionI18n = LocalizedString.empty();

    /**
     * Lista de funcionalidades inclusas no plano.
     * Armazenada como JSONB para flexibilidade sem migrations extras.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> features = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = com.mangareader.infrastructure.persistence.postgres.converter.LocalizedStringListJsonConverter.class)
    @Column(name = "features_i18n", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private LocalizedStringList featuresI18n = LocalizedStringList.empty();

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    /**
     * Preços em múltiplas moedas (currency code ISO 4217 → centavos).
     * Exemplo: {@code {"BRL": 1990, "USD": 399}}.
     * <p>
     * {@link #priceInCents} mantém o valor BRL para compatibilidade retroativa.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private Map<String, Long> prices = new HashMap<>();
}
