package com.mangareader.domain.user.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.mangareader.domain.user.valueobject.AdultContentPreference;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "comment_visibility", nullable = false, length = 20)
    @Builder.Default
    private VisibilitySetting commentVisibility = VisibilitySetting.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "view_history_visibility", nullable = false, length = 20)
    @Builder.Default
    private VisibilitySetting viewHistoryVisibility = VisibilitySetting.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "adult_content_preference", nullable = false, length = 20)
    @Builder.Default
    private AdultContentPreference adultContentPreference = AdultContentPreference.BLUR;

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

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
