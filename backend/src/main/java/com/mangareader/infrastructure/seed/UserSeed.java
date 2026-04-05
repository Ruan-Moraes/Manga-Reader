package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class UserSeed implements EntitySeeder {
    private final UserJpaRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public int getOrder() {
        return 1;
    }

    @Override
    public void seed() {
        if (userRepository.count() > 0) {
            log.info("Usuários já existem — seed de users ignorado.");

            return;
        }

        var hash = passwordEncoder.encode("123456");

        var users = List.of(
                User.builder()
                        .name("Leitor Demo")
                        .email("demo@mangareader.com")
                        .passwordHash(hash)
                        .bio("Fã de fantasia, ação e slice of life. Sempre em busca do próximo mangá para maratonar.")
                        .photoUrl("https://i.pravatar.cc/100?img=32")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Mika Tanaka")
                        .email("mika@mangareader.com")
                        .passwordHash(hash)
                        .bio("Apaixonada por shoujo e romance. Leitora ativa desde 2018.")
                        .photoUrl("https://i.pravatar.cc/100?img=11")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Carlos Henrique")
                        .email("carlos@mangareader.com")
                        .passwordHash(hash)
                        .bio("Colecionador de edições físicas e entusiasta de seinen.")
                        .photoUrl("https://i.pravatar.cc/100?img=15")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Ana Beatriz")
                        .email("admin@mangareader.com")
                        .passwordHash(hash)
                        .bio("Tradutora amadora e revisora voluntária.")
                        .photoUrl("https://i.pravatar.cc/100?img=21")
                        .role(UserRole.ADMIN)
                        .build()
        );

        userRepository.saveAll(users);

        log.info("✓ {} usuários de demonstração criados.", users.size());
    }
}
