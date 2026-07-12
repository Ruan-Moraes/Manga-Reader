package com.mangareader.domain.store.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.mangareader.domain.store.valueobject.StoreAvailability;
import com.mangareader.domain.store.valueobject.StoreCategory;
import com.mangareader.domain.store.valueobject.StoreStatus;
import com.mangareader.infrastructure.persistence.postgres.converter.LocalizedStringJsonConverter;
import com.mangareader.shared.domain.i18n.LocalizedString;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Loja parceira (PostgreSQL).
 * <p>
 * Compatível com o frontend ({@code Store} em store.types.ts).
 */
@Entity
@Table(name = "stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Store {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = LocalizedStringJsonConverter.class)
    @Column(name = "name", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private LocalizedString name = LocalizedString.empty();

    private String logo;
    private String icon;

    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = LocalizedStringJsonConverter.class)
    @Column(name = "description", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private LocalizedString description = LocalizedString.empty();

    @Column(nullable = false)
    private String website;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StoreStatus status = StoreStatus.ACTIVE;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StoreAvailability availability;

    private Double rating;

    /** Preço atual em centavos BRL (ex.: 3990 = R$ 39,90). DT-46. */
    private Integer price;

    /** Preço original riscado em centavos BRL. */
    @Column(name = "old_price")
    private Integer oldPrice;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StoreCategory category;

    /** Loja oficial/verificada. */
    @Column(nullable = false)
    @Builder.Default
    private boolean official = false;

    /** Total de avaliações da loja (fonte externa). */
    @Column(name = "rating_count")
    private Integer ratingCount;

    /** Formato do produto (ex.: "Volume único · brochura"). */
    private String format;

    /** Informação de frete/entrega. */
    private String shipping;

    /** Nota curta de destaque (ex.: "Menor preço novo"). */
    private String note;

    /** Monograma 1–2 letras para o logo placeholder. */
    private String mono;

    /** Cor de fundo do logo monograma. */
    private String color;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> features = new ArrayList<>();

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StoreTitle> titles = new ArrayList<>();
}
