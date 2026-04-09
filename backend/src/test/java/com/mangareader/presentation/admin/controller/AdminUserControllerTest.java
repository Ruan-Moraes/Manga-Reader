package com.mangareader.presentation.admin.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.usecase.admin.BanUserUseCase;
import com.mangareader.application.user.usecase.admin.ChangeUserRoleUseCase;
import com.mangareader.application.user.usecase.admin.GetUserDetailsUseCase;
import com.mangareader.application.user.usecase.admin.ListUsersUseCase;
import com.mangareader.application.user.usecase.admin.UnbanUserUseCase;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.ResourceNotFoundException;

@WebMvcTest(AdminUserController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminUserController")
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private ListUsersUseCase listUsersUseCase;

    @MockitoBean
    private GetUserDetailsUseCase getUserDetailsUseCase;

    @MockitoBean
    private ChangeUserRoleUseCase changeUserRoleUseCase;

    @MockitoBean
    private BanUserUseCase banUserUseCase;

    @MockitoBean
    private UnbanUserUseCase unbanUserUseCase;

    private final UUID ADMIN_ID = UUID.randomUUID();
    private final UUID USER_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(ADMIN_ID);
        return auth;
    }

    private User buildUser(UUID id, String name, UserRole role) {
        return User.builder()
                .id(id)
                .name(name)
                .email(name.toLowerCase().replace(" ", "") + "@test.com")
                .passwordHash("hash")
                .role(role)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("GET /api/admin/users")
    class ListUsers {

        @Test
        @DisplayName("Deve retornar 200 com lista paginada de usuários")
        void deveRetornar200() throws Exception {
            var users = List.of(buildUser(USER_ID, "Ruan", UserRole.MEMBER));
            when(listUsersUseCase.execute(any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(users));

            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].name").value("Ruan"))
                    .andExpect(jsonPath("$.data.totalElements").value(1));
        }

        @Test
        @DisplayName("Deve retornar 200 com busca por search")
        void deveRetornar200ComBusca() throws Exception {
            var users = List.of(buildUser(USER_ID, "Ruan", UserRole.MEMBER));
            when(listUsersUseCase.execute(eq("Ruan"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(users));

            mockMvc.perform(get("/api/admin/users").param("search", "Ruan"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isNotEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/admin/users/{id}")
    class GetUserDetails {

        @Test
        @DisplayName("Deve retornar 200 com detalhes do usuário")
        void deveRetornar200() throws Exception {
            when(getUserDetailsUseCase.execute(USER_ID))
                    .thenReturn(buildUser(USER_ID, "Ruan", UserRole.MEMBER));

            mockMvc.perform(get("/api/admin/users/{id}", USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name").value("Ruan"))
                    .andExpect(jsonPath("$.data.role").value("MEMBER"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando usuário não existe")
        void deveRetornar404() throws Exception {
            when(getUserDetailsUseCase.execute(USER_ID))
                    .thenThrow(new ResourceNotFoundException("User", "id", USER_ID));

            mockMvc.perform(get("/api/admin/users/{id}", USER_ID))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /api/admin/users/{id}/role")
    class ChangeRole {

        @Test
        @DisplayName("Deve retornar 200 ao alterar role")
        void deveRetornar200() throws Exception {
            var user = buildUser(USER_ID, "Ruan", UserRole.MODERATOR);
            when(changeUserRoleUseCase.execute(any(UUID.class), eq(USER_ID), eq(UserRole.MODERATOR)))
                    .thenReturn(user);

            mockMvc.perform(patch("/api/admin/users/{id}/role", USER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"role": "MODERATOR"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.role").value("MODERATOR"));
        }
    }

    @Nested
    @DisplayName("POST /api/admin/users/{id}/ban")
    class BanUser {

        @Test
        @DisplayName("Deve retornar 200 ao banir usuário")
        void deveRetornar200() throws Exception {
            var user = buildUser(USER_ID, "Spammer", UserRole.MEMBER);
            user.setBanned(true);
            user.setBannedReason("Spam");
            when(banUserUseCase.execute(eq(USER_ID), eq("Spam"), any()))
                    .thenReturn(user);

            mockMvc.perform(post("/api/admin/users/{id}/ban", USER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"reason": "Spam"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.banned").value(true))
                    .andExpect(jsonPath("$.data.bannedReason").value("Spam"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando motivo está em branco")
        void deveRetornar400SemMotivo() throws Exception {
            mockMvc.perform(post("/api/admin/users/{id}/ban", USER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"reason": ""}
                                    """))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/admin/users/{id}/ban")
    class UnbanUser {

        @Test
        @DisplayName("Deve retornar 200 ao desbanir usuário")
        void deveRetornar200() throws Exception {
            var user = buildUser(USER_ID, "ExBanned", UserRole.MEMBER);
            when(unbanUserUseCase.execute(USER_ID)).thenReturn(user);

            mockMvc.perform(delete("/api/admin/users/{id}/ban", USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.banned").value(false));
        }
    }
}
