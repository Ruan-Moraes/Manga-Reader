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
 * Após Fase B i18n: {@code label} multilíngue (JSONB) para apresentação;
 * {@code slug} é a chave canônica imutável (identificador de domínio, mono-idioma),
 * referenciada pelos gêneros dos títulos no MongoDB.
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

    /** Chave canônica estável (UPPER_SNAKE, ex.: {@code ACTION}). Única, imutável. */
    @Column(name = "slug", length = 60, nullable = false, unique = true)
    private String slug;

    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = LocalizedStringJsonConverter.class)
    @Column(name = "label", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private LocalizedString label = LocalizedString.empty();
}
