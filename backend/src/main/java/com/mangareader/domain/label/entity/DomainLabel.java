package com.mangareader.domain.label.entity;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Label multilíngue para enums de domínio (status, categorias, tipos, moedas…).
 * <p>
 * Armazenado em PostgreSQL com {@link LocalizedString} JSONB. O backend resolve
 * o label conforme o {@code Accept-Language} do request via
 * {@code LocalizedMappingHelper}, retornando ao frontend a string já traduzida.
 * <p>
 * Compatível com o frontend {@code DomainLabelOption { value, label }}.
 */
@Entity
@Table(
    name = "domain_labels",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_domain_labels_type_value",
        columnNames = {"type", "value"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DomainLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String type;

    @Column(nullable = false, length = 60)
    private String value;

    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = LocalizedStringJsonConverter.class)
    @Column(name = "label_i18n", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private LocalizedString labelI18n = LocalizedString.empty();
}
