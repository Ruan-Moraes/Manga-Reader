package com.mangareader.mock.user;

import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserSocialLink;
import com.mangareader.domain.user.valueobject.UserRole;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class UserMock {

    private UserMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final UUID READER_ID   = UUID.fromString("00000000-0000-0000-0000-000000000001");
    public static final UUID ADMIN_ID    = UUID.fromString("00000000-0000-0000-0000-000000000002");
    public static final UUID MOD_ID      = UUID.fromString("00000000-0000-0000-0000-000000000003");
    public static final UUID POSTER_ID   = UUID.fromString("00000000-0000-0000-0000-000000000004");
    public static final UUID INACTIVE_ID = UUID.fromString("00000000-0000-0000-0000-000000000005");

    // ── Single entities ────────────────────────────────────────────────────

    public static User reader() {
        return User.builder()
                .id(READER_ID)
                .name("Leitor Demo")
                .email("demo@mangareader.com")
                .passwordHash("$2a$10$hashedpassword")
                .bio("Apaixonado por mangás de aventura e fantasia.")
                .photoUrl("https://i.pravatar.cc/100?img=32")
                .role(UserRole.MEMBER)
                .socialLinks(new ArrayList<>())
                .build();
    }

    public static User admin() {
        return User.builder()
                .id(ADMIN_ID)
                .name("Ana Beatriz")
                .email("admin@mangareader.com")
                .passwordHash("$2a$10$hashedpassword")
                .bio("Administradora e tradutora voluntária.")
                .photoUrl("https://i.pravatar.cc/100?img=21")
                .role(UserRole.ADMIN)
                .socialLinks(new ArrayList<>())
                .build();
    }

    public static User moderator() {
        return User.builder()
                .id(MOD_ID)
                .name("Sakura Mendes")
                .email("mod@mangareader.com")
                .passwordHash("$2a$10$hashedpassword")
                .bio("Moderadora desde 2023. Especialista em horror japonês.")
                .photoUrl("https://i.pravatar.cc/100?img=19")
                .role(UserRole.MODERATOR)
                .socialLinks(new ArrayList<>())
                .build();
    }

    public static User poster() {
        return User.builder()
                .id(POSTER_ID)
                .name("Haru Yamamoto")
                .email("poster@mangareader.com")
                .passwordHash("$2a$10$hashedpassword")
                .bio("Estudante de japonês e tradutor iniciante.")
                .photoUrl("https://i.pravatar.cc/100?img=35")
                .role(UserRole.MEMBER)
                .socialLinks(new ArrayList<>())
                .build();
    }

    public static User withoutBio() {
        return User.builder()
                .id(INACTIVE_ID)
                .name("Novo Usuario")
                .email("novo@mangareader.com")
                .passwordHash("$2a$10$hashedpassword")
                .role(UserRole.MEMBER)
                .socialLinks(new ArrayList<>())
                .build();
    }

    public static User withSocialLinks() {
        User user = reader();
        user.getSocialLinks().add(
                UserSocialLink.builder()
                        .id(UUID.randomUUID())
                        .user(user)
                        .platform("Twitter")
                        .url("https://twitter.com/leitordemo")
                        .build()
        );
        user.getSocialLinks().add(
                UserSocialLink.builder()
                        .id(UUID.randomUUID())
                        .user(user)
                        .platform("Discord")
                        .url("https://discord.gg/leitordemo")
                        .build()
        );
        return user;
    }

    public static User withId(UUID id) {
        return User.builder()
                .id(id)
                .name("User " + id.toString().substring(0, 8))
                .email(id.toString().substring(0, 8) + "@mangareader.com")
                .passwordHash("$2a$10$hashedpassword")
                .role(UserRole.MEMBER)
                .socialLinks(new ArrayList<>())
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<User> allRoles() {
        return List.of(reader(), admin(), moderator());
    }

    public static List<User> pool() {
        return List.of(reader(), admin(), moderator(), poster(), withoutBio());
    }
}
