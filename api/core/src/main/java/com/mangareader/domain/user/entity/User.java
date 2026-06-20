package com.mangareader.domain.user.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import com.mangareader.domain.user.valueobject.UserRole;

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
 * Usuário da plataforma (PostgreSQL).
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(length = 500)
    private String bio;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "banner_url")
    private String bannerUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.MEMBER;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_locales", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> contentLocales = new ArrayList<>(List.of("pt-BR"));

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserSocialLink> socialLinks = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserRecommendation> recommendations = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private boolean banned = false;

    @Column(name = "banned_at")
    private LocalDateTime bannedAt;

    @Column(name = "banned_reason", length = 500)
    private String bannedReason;

    @Column(name = "banned_until")
    private LocalDateTime bannedUntil;

    @Column(nullable = false)
    @Builder.Default
    private boolean deactivated = false;

    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void updateContentLocales(List<String> contentLocales) {
        if (contentLocales == null || contentLocales.isEmpty()) {
            throw new IllegalArgumentException("contentLocales must not be empty");
        }

        List<String> normalized = new ArrayList<>(contentLocales.size());

        for (String tag : contentLocales) {
            if (tag == null || tag.isBlank()) {
                throw new IllegalArgumentException("contentLocales entries must not be blank");
            }

            normalized.add(normalizeTag(tag));
        }

        this.contentLocales = normalized;
    }

    /**
     * Desativa a conta e anonimiza os dados pessoais (soft-delete). Operação
     * irreversível: limpa identidade, redes e recomendações, e libera o e-mail
     * original substituindo-o por um marcador único derivado do id.
     */
    public void deactivate() {
        if (this.id == null) {
            throw new IllegalStateException("Não é possível desativar usuário sem id");
        }

        this.deactivated = true;
        this.deactivatedAt = LocalDateTime.now();
        this.name = "Usuário removido";
        this.email = "deleted+" + this.id + "@deleted.local";
        this.passwordHash = "DEACTIVATED";
        this.bio = null;
        this.photoUrl = null;
        this.bannerUrl = null;
        this.socialLinks.clear();
        this.recommendations.clear();
    }

    private static String normalizeTag(String tag) {
        Locale locale = Locale.forLanguageTag(tag);

        String normalized = locale.toLanguageTag();

        if (normalized.isEmpty() || "und".equals(normalized)) {
            throw new IllegalArgumentException("Invalid BCP 47 language tag: " + tag);
        }

        return normalized;
    }
}
