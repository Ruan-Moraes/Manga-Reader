package com.mangareader.domain.user.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.mangareader.domain.user.valueobject.AdultContentPreference;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Configurações do perfil do usuário (PostgreSQL).
 */
@Entity
@Table(name = "user_profile_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileSettings {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static UserProfileSettings defaults(User user) {
        return UserProfileSettings.builder()
                .user(user)
                .commentVisibility(VisibilitySetting.PUBLIC)
                .viewHistoryVisibility(VisibilitySetting.PUBLIC)
                .adultContentPreference(AdultContentPreference.BLUR)
                .build();
    }
}
