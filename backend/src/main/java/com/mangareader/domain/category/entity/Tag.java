package com.mangareader.domain.category.entity;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.mangareader.infrastructure.persistence.postgres.converter.LocalizedStringJsonConverter;
import com.mangareader.shared.domain.i18n.LocalizedString;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
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
 * Tag / gênero disponível no sistema (PostgreSQL).
 * <p>
 * Compatível com o frontend ({@code Tag} em tag.types.ts):
 * <pre>{ value: number, label: string }</pre>
 */
@Entity
@Table(name = "tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String label;

    /**
     * Versão multilíngue de {@link #label} (mapa BCP 47 → texto).
     * Adicionada na V12 (Etapa 2 i18n). Coexiste com {@code label} até a Fase B
     * (refatoração de callers + drop da coluna antiga).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = LocalizedStringJsonConverter.class)
    @Column(name = "label_i18n", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private LocalizedString labelI18n = LocalizedString.empty();
}
