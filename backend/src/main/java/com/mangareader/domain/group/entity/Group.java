package com.mangareader.domain.group.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.mangareader.domain.group.valueobject.GroupStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
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
 * Grupo de tradução / scanlation (PostgreSQL).
 * <p>
 * Compatível com o frontend ({@code Group} em group.types.ts).
 */
@Entity
@Table(name = "groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    private String logo;
    private String banner;

    @Column(length = 2000)
    private String description;

    private String website;

    @Column(name = "total_titles")
    @Builder.Default
    private int totalTitles = 0;

    @Column(name = "founded_year")
    private Integer foundedYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private GroupStatus status = GroupStatus.ACTIVE;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> genres = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "focus_tags", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> focusTags = new ArrayList<>();

    @Builder.Default
    private double rating = 0.0;

    @Builder.Default
    private int popularity = 0;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GroupMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GroupWork> translatedWorks = new ArrayList<>();

    @Column(name = "platform_joined_at")
    @CreationTimestamp
    private LocalDateTime platformJoinedAt;
}
