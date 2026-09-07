package com.toonlira.infrastructure.seed;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.domain.user.entity.User;
import com.toonlira.domain.user.entity.UserProfileSettings;
import com.toonlira.domain.user.entity.UserSystemSettings;
import com.toonlira.domain.user.valueobject.UserRole;
import com.toonlira.domain.user.valueobject.VisibilitySetting;
import com.toonlira.infrastructure.persistence.postgres.repository.UserJpaRepository;
import com.toonlira.infrastructure.persistence.postgres.repository.UserProfileSettingsJpaRepository;
import com.toonlira.infrastructure.persistence.postgres.repository.UserSystemSettingsJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class UserSeed implements EntitySeeder {
    private final UserJpaRepository userRepository;
    private final UserProfileSettingsJpaRepository profileSettingsRepository;
    private final UserSystemSettingsJpaRepository systemSettingsRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public int getOrder() {
        return 1;
    }

    @Override
    @Transactional
    public void seed() {
        if (userRepository.count() > 0) {
            log.info("Usuários já existem — seed de users ignorado.");

            return;
        }

        var hash = passwordEncoder.encode("123456");

        var users = List.of(
                User.builder()
                        .name("Leitor Demo")
                        .email("demo@toonlira.com")
                        .passwordHash(hash)
                        .bio("Fã de fantasia, ação e slice of life. Sempre em busca do próximo mangá para maratonar.")
                        .photoUrl("https://i.pravatar.cc/100?img=32")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Mika Tanaka")
                        .email("mika@toonlira.com")
                        .passwordHash(hash)
                        .bio("Apaixonada por shoujo e romance. Leitora ativa desde 2018.")
                        .photoUrl("https://i.pravatar.cc/100?img=11")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Carlos Henrique")
                        .email("carlos@toonlira.com")
                        .passwordHash(hash)
                        .bio("Colecionador de edições físicas e entusiasta de seinen.")
                        .photoUrl("https://i.pravatar.cc/100?img=15")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Ana Beatriz")
                        .email("admin@toonlira.com")
                        .passwordHash(hash)
                        .bio("Tradutora amadora e revisora voluntária.")
                        .photoUrl("https://i.pravatar.cc/100?img=21")
                        .role(UserRole.ADMIN)
                        .build(),
                User.builder()
                        .name("Roberta Lima")
                        .email("roberta@toonlira.com")
                        .passwordHash(hash)
                        .bio("Moderadora do fórum e entusiasta de webtoons coreanos.")
                        .photoUrl("https://i.pravatar.cc/100?img=25")
                        .role(UserRole.MODERATOR)
                        .build(),
                User.builder()
                        .name("Tomás Nogueira")
                        .email("tomas@toonlira.com")
                        .passwordHash(hash)
                        .bio("Leitor casual de mangás de ação.")
                        .photoUrl("https://i.pravatar.cc/100?img=56")
                        .role(UserRole.MEMBER)
                        .banned(true)
                        .bannedAt(LocalDateTime.now().minusDays(30))
                        .bannedReason("Spam reiterado em comentários e flood no fórum.")
                        .build(),
                User.builder()
                        .name("Pedro Silva")
                        .email("pedro@toonlira.com")
                        .passwordHash(hash)
                        .bio("Fã de seinen e horror.")
                        .photoUrl("https://i.pravatar.cc/100?img=60")
                        .role(UserRole.MEMBER)
                        .banned(true)
                        .bannedAt(LocalDateTime.now().minusDays(2))
                        .bannedReason("Linguagem ofensiva em comentários.")
                        .bannedUntil(LocalDateTime.now().plusDays(5))
                        .build(),
                User.builder()
                        .name("Yuki Sato")
                        .email("yuki@toonlira.com")
                        .passwordHash(hash)
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Sofia Cardoso")
                        .email("sofia@toonlira.com")
                        .passwordHash(hash)
                        .bio("Leitora ávida de romance e fantasia. Prefere manter perfil discreto.")
                        .photoUrl("https://i.pravatar.cc/100?img=29")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Diego Martins")
                        .email("diego@toonlira.com")
                        .passwordHash(hash)
                        .bio("Moderador e curador de conteúdo. Especialista em mangás clássicos.")
                        .photoUrl("https://i.pravatar.cc/100?img=68")
                        .bannerUrl("https://picsum.photos/1200/300?random=901")
                        .role(UserRole.MODERATOR)
                        .build()
        );

        var savedUsers = userRepository.saveAll(users);
        var profileSettings = savedUsers.stream()
                .map(user -> {
                    var settings = UserProfileSettings.defaults(user);

                    if ("sofia@toonlira.com".equals(user.getEmail())) {
                        settings.setCommentVisibility(VisibilitySetting.PRIVATE);
                        settings.setViewHistoryVisibility(VisibilitySetting.DO_NOT_TRACK);
                    }

                    return settings;
                })
                .toList();

        profileSettingsRepository.saveAll(profileSettings);
        systemSettingsRepository.saveAll(savedUsers.stream()
                .map(UserSystemSettings::defaults)
                .toList());

        log.info("✓ {} usuários de demonstração criados.", users.size());
    }
}
