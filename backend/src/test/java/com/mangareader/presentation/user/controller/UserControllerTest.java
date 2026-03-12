package com.mangareader.presentation.user.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.user.usecase.GetUserProfileUseCase;
import com.mangareader.application.user.usecase.UpdateUserProfileUseCase;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.ResourceNotFoundException;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("UserController")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetUserProfileUseCase getUserProfileUseCase;

    @MockitoBean
    private UpdateUserProfileUseCase updateUserProfileUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(USER_ID);
        return auth;
    }

    private User buildUser(UUID id) {
        return User.builder()
                .id(id)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .bio("Leitor apaixonado por mangás")
                .role(UserRole.MEMBER)
                .socialLinks(List.of())
                .build();
    }

    @Nested
    @DisplayName("GET /api/users/me")
    class GetMyProfile {

        @Test
        @DisplayName("Deve retornar 200 com perfil do usuário autenticado")
        void deveRetornar200() throws Exception {
            when(getUserProfileUseCase.execute(USER_ID)).thenReturn(buildUser(USER_ID));

            mockMvc.perform(get("/api/users/me").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Ruan Silva"))
                    .andExpect(jsonPath("$.data.email").value("ruan@email.com"));
        }
    }

    @Nested
    @DisplayName("GET /api/users/{id}")
    class GetPublicProfile {

        @Test
        @DisplayName("Deve retornar 200 com perfil público do usuário")
        void deveRetornar200() throws Exception {
            var userId = UUID.randomUUID();
            when(getUserProfileUseCase.execute(userId)).thenReturn(buildUser(userId));

            mockMvc.perform(get("/api/users/{id}", userId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Ruan Silva"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando usuário não existe")
        void deveRetornar404() throws Exception {
            var userId = UUID.randomUUID();
            when(getUserProfileUseCase.execute(userId))
                    .thenThrow(new ResourceNotFoundException("User", "id", userId));

            mockMvc.perform(get("/api/users/{id}", userId))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /api/users/me")
    class UpdateMyProfile {

        @Test
        @DisplayName("Deve retornar 200 ao atualizar perfil com sucesso")
        void deveRetornar200() throws Exception {
            var updatedUser = User.builder()
                    .id(USER_ID)
                    .name("Ruan Moraes")
                    .email("ruan@email.com")
                    .passwordHash("hash")
                    .bio("Bio atualizada")
                    .role(UserRole.MEMBER)
                    .socialLinks(List.of())
                    .build();
            when(updateUserProfileUseCase.execute(any())).thenReturn(updatedUser);

            mockMvc.perform(patch("/api/users/me")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "Ruan Moraes", "bio": "Bio atualizada"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Ruan Moraes"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando nome tem menos de 2 caracteres")
        void deveRetornar400NomeMuitoCurto() throws Exception {
            mockMvc.perform(patch("/api/users/me")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "R"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando bio ultrapassa 500 caracteres")
        void deveRetornar400BioMuitoLonga() throws Exception {
            var bioLonga = "x".repeat(501);
            mockMvc.perform(patch("/api/users/me")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"bio": "%s"}
                                    """.formatted(bioLonga))
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 200 com campos nulos (PATCH semântico)")
        void deveRetornar200ComCamposNulos() throws Exception {
            when(updateUserProfileUseCase.execute(any())).thenReturn(buildUser(USER_ID));

            mockMvc.perform(patch("/api/users/me")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}
