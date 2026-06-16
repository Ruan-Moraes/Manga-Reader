package com.mangareader.presentation.user.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.usecase.AddRecommendationUseCase;
import com.mangareader.application.user.usecase.GetEnrichedProfileUseCase;
import com.mangareader.application.user.usecase.GetUserCommentsUseCase;
import com.mangareader.application.user.usecase.GetUserProfileUseCase;
import com.mangareader.application.user.usecase.GetUserViewHistoryUseCase;
import com.mangareader.application.user.usecase.RecordViewHistoryUseCase;
import com.mangareader.application.user.usecase.RemoveRecommendationUseCase;
import com.mangareader.application.user.usecase.ReorderRecommendationsUseCase;
import com.mangareader.application.user.usecase.UpdatePrivacySettingsUseCase;
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

    @MockitoBean
    private GetEnrichedProfileUseCase getEnrichedProfileUseCase;

    @MockitoBean
    private AddRecommendationUseCase addRecommendationUseCase;

    @MockitoBean
    private RemoveRecommendationUseCase removeRecommendationUseCase;

    @MockitoBean
    private ReorderRecommendationsUseCase reorderRecommendationsUseCase;

    @MockitoBean
    private UpdatePrivacySettingsUseCase updatePrivacySettingsUseCase;

    @MockitoBean
    private com.mangareader.application.user.usecase.UpdateLanguagePreferencesUseCase updateLanguagePreferencesUseCase;

    @MockitoBean
    private com.mangareader.application.user.usecase.UpdateUserSettingsUseCase updateUserSettingsUseCase;

    @MockitoBean
    private GetUserCommentsUseCase getUserCommentsUseCase;

    @MockitoBean
    private RecordViewHistoryUseCase recordViewHistoryUseCase;

    @MockitoBean
    private GetUserViewHistoryUseCase getUserViewHistoryUseCase;

    @MockitoBean
    private com.mangareader.application.user.usecase.GetUserGroupsUseCase getUserGroupsUseCase;

    @MockitoBean
    private com.mangareader.presentation.user.mapper.UserGroupMapper userGroupMapper;

    @MockitoBean
    private com.mangareader.application.user.usecase.DeleteAccountUseCase deleteAccountUseCase;

    @MockitoBean
    private TokenPort tokenPort;

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

    @Nested
    @DisplayName("GET /api/users/me/content-locales")
    class GetMyContentLocales {
        @Test
        @DisplayName("Deve retornar 200 com contentLocales do usuário")
        void deveRetornar200() throws Exception {
            User user = buildUser(USER_ID);

            user.setContentLocales(List.of("en-US", "pt-BR"));

            when(getUserProfileUseCase.execute(USER_ID)).thenReturn(user);

            mockMvc.perform(get("/api/users/me/content-locales").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.contentLocales[0]").value("en-US"))
                    .andExpect(jsonPath("$.data.contentLocales[1]").value("pt-BR"));
        }
    }

    @Nested
    @DisplayName("PATCH /api/users/me/content-locales")
    class UpdateMyContentLocales {
        @Test
        @DisplayName("Deve retornar 200 com contentLocales atualizados")
        void deveRetornar200() throws Exception {
            User updated = buildUser(USER_ID);

            updated.setContentLocales(List.of("es-ES", "pt-BR"));

            when(updateLanguagePreferencesUseCase.execute(
                    org.mockito.ArgumentMatchers.eq(USER_ID),
                    org.mockito.ArgumentMatchers.eq(List.of("es-ES", "pt-BR"))
            )).thenReturn(updated);

            mockMvc.perform(patch("/api/users/me/content-locales")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"contentLocales\":[\"es-ES\",\"pt-BR\"]}")
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.contentLocales[0]").value("es-ES"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando contentLocales vazio")
        void deveRetornar400() throws Exception {
            mockMvc.perform(patch("/api/users/me/content-locales")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"contentLocales\":[]}")
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/users/me/groups")
    class GetMyGroups {
        @Test
        @DisplayName("Deve retornar 200 com grupos vinculados e disponíveis")
        void deveRetornar200() throws Exception {
            var linked = new com.mangareader.presentation.user.dto.UserGroupsResponse.UserGroupItemResponse(
                    UUID.randomUUID().toString(), "Scan One Piece", "scan-op", null, "Tradutor(a)", 5L);
            var available = new com.mangareader.presentation.user.dto.UserGroupsResponse.UserGroupItemResponse(
                    UUID.randomUUID().toString(), "Scan Naruto", "scan-naruto", null, null, 3L);
            var response = new com.mangareader.presentation.user.dto.UserGroupsResponse(
                    List.of(linked), List.of(available));

            when(getUserGroupsUseCase.execute(USER_ID)).thenReturn(
                    new com.mangareader.application.user.usecase.GetUserGroupsUseCase.UserGroups(List.of(), List.of()));
            when(userGroupMapper.toResponse(any(), any(), any())).thenReturn(response);

            mockMvc.perform(get("/api/users/me/groups").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.linked[0].username").value("scan-op"))
                    .andExpect(jsonPath("$.data.linked[0].role").value("Tradutor(a)"))
                    .andExpect(jsonPath("$.data.available[0].username").value("scan-naruto"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/users/me")
    class DeleteMyAccount {
        @Test
        @DisplayName("Deve retornar 204 ao excluir a conta")
        void deveRetornar204() throws Exception {
            mockMvc.perform(delete("/api/users/me").principal(mockAuth()))
                    .andExpect(status().isNoContent());

            org.mockito.Mockito.verify(deleteAccountUseCase).execute(USER_ID);
        }
    }

    private static final String VALID_SETTINGS = """
            {
              "reader": {"direction":"RTL","mode":"VERTICAL","fit":"WIDTH","quality":"AUTO","gap":8,"background":"DARK","autoMarkRead":true,"preload":3},
              "appearance": {"theme":"DARK","fontSize":"DEFAULT","density":"COMFORTABLE","animations":true},
              "locale": {"dateFormat":"D_MON","timezone":"America/Sao_Paulo"},
              "accessibility": {"reduceMotion":false,"highContrast":false,"captions":false}
            }
            """;

    @Nested
    @DisplayName("GET /api/users/me/settings")
    class GetMySettings {
        @Test
        @DisplayName("Deve retornar 200 com as configurações do usuário")
        void deveRetornar200() throws Exception {
            when(getUserProfileUseCase.execute(USER_ID)).thenReturn(buildUser(USER_ID));

            mockMvc.perform(get("/api/users/me/settings").principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.reader.direction").value("RTL"))
                    .andExpect(jsonPath("$.data.appearance.theme").value("DARK"));
        }
    }

    @Nested
    @DisplayName("PATCH /api/users/me/settings")
    class UpdateMySettings {
        @Test
        @DisplayName("Deve retornar 200 ao atualizar configurações válidas")
        void deveRetornar200() throws Exception {
            when(updateUserSettingsUseCase.execute(any(), any())).thenReturn(buildUser(USER_ID));

            mockMvc.perform(patch("/api/users/me/settings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_SETTINGS)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.reader.direction").value("RTL"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando gap está fora do intervalo")
        void deveRetornar400GapInvalido() throws Exception {
            String body = VALID_SETTINGS.replace("\"gap\":8", "\"gap\":999");

            mockMvc.perform(patch("/api/users/me/settings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }
}
