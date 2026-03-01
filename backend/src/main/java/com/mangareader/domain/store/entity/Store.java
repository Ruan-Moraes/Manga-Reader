package com.mangareader.domain.store.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.mangareader.domain.store.valueobject.StoreAvailability;

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

    @Column(nullable = false, length = 100)
    private String name;

    private String logo;
    private String icon;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String website;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StoreAvailability availability;

    private Double rating;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> features = new ArrayList<>();
}
