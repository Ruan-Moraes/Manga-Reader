package com.mangareader.presentation.user.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.usecase.GetUserActivityFeedUseCase;
import com.mangareader.application.user.usecase.HideActivityEventUseCase;
import com.mangareader.domain.user.entity.ActivityEvent;
import com.mangareader.domain.user.entity.ActivityEventType;
import com.mangareader.domain.user.entity.activity.TitleCompletedPayload;

@WebMvcTest(ActivityFeedController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ActivityFeedController")
class ActivityFeedControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetUserActivityFeedUseCase getUserActivityFeedUseCase;

    @MockitoBean
    private HideActivityEventUseCase hideActivityEventUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    private final UUID USER_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(USER_ID);
        return auth;
    }

    private ActivityEvent buildEvent() {
        return ActivityEvent.builder()
                .id("ae-1")
                .userId(USER_ID.toString())
                .type(ActivityEventType.TITLE_COMPLETED)
                .payload(new TitleCompletedPayload("t1", "Naruto", "cover.jpg"))
                .build();
    }

    @Nested
    @DisplayName("GET /api/users/{userId}/activity-feed")
    class GetActivityFeed {

        @Test
        @DisplayName("Deve retornar 200 com os eventos do usuário autenticado")
        void deveRetornar200Autenticado() throws Exception {
            when(getUserActivityFeedUseCase.execute(eq(USER_ID), eq(USER_ID), any()))
                    .thenReturn(new PageImpl<>(List.of(buildEvent())));

            mockMvc.perform(get("/api/users/{userId}/activity-feed", USER_ID)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].type").value("TITLE_COMPLETED"));
        }

        @Test
        @DisplayName("Deve retornar 200 para visitante anônimo (viewer null)")
        void deveRetornar200Anonimo() throws Exception {
            when(getUserActivityFeedUseCase.execute(eq(USER_ID), eq(null), any()))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/users/{userId}/activity-feed", USER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("DELETE /api/users/me/activity-feed/{eventId}")
    class Hide {

        @Test
        @DisplayName("Deve retornar 204 ao ocultar evento")
        void deveRetornar204() throws Exception {
            mockMvc.perform(delete("/api/users/me/activity-feed/{eventId}", "ae-1")
                            .principal(mockAuth()))
                    .andExpect(status().isNoContent());
        }
    }
}
