package com.mangareader.presentation.admin.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.subscription.usecase.admin.CreateSubscriptionPlanUseCase;
import com.mangareader.application.subscription.usecase.admin.GetSubscriptionAuditLogsUseCase;
import com.mangareader.application.subscription.usecase.admin.GetSubscriptionGrowthUseCase;
import com.mangareader.application.subscription.usecase.admin.GetSubscriptionSummaryUseCase;
import com.mangareader.application.subscription.usecase.admin.GrantSubscriptionUseCase;
import com.mangareader.application.subscription.usecase.admin.ListSubscriptionPlansAdminUseCase;
import com.mangareader.application.subscription.usecase.admin.ListSubscriptionsAdminUseCase;
import com.mangareader.application.subscription.usecase.admin.RevokeSubscriptionUseCase;
import com.mangareader.application.subscription.usecase.admin.UpdateSubscriptionPlanUseCase;
import com.mangareader.application.subscription.usecase.admin.UpdateSubscriptionStatusAdminUseCase;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;

@WebMvcTest(AdminSubscriptionController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminSubscriptionController")
class AdminSubscriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private ListSubscriptionsAdminUseCase listSubscriptionsUseCase;

    @MockitoBean
    private UpdateSubscriptionStatusAdminUseCase updateStatusUseCase;

    @MockitoBean
    private GetSubscriptionSummaryUseCase summaryUseCase;

    @MockitoBean
    private ListSubscriptionPlansAdminUseCase listPlansUseCase;

    @MockitoBean
    private CreateSubscriptionPlanUseCase createPlanUseCase;

    @MockitoBean
    private UpdateSubscriptionPlanUseCase updatePlanUseCase;

    @MockitoBean
    private GrantSubscriptionUseCase grantUseCase;

    @MockitoBean
    private RevokeSubscriptionUseCase revokeUseCase;

    @MockitoBean
    private GetSubscriptionAuditLogsUseCase auditLogsUseCase;

    @MockitoBean
    private GetSubscriptionGrowthUseCase growthUseCase;

    private static final UUID SUBSCRIPTION_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    private static SubscriptionPlan buildPlan() {
        return SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .period(SubscriptionPeriod.MONTHLY)
                .priceInCents(1990L)
                .description("Mensal")
                .features(List.of("HD", "Offline"))
                .build();
    }

    private static Subscription buildSubscription() {
        return Subscription.builder()
                .id(SUBSCRIPTION_ID)
                .userId(USER_ID)
                .plan(buildPlan())
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusMonths(1))
                .status(SubscriptionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("GET /api/admin/subscriptions")
    class ListSubscriptions {

        @Test
        @DisplayName("deve retornar 200 com lista paginada")
        void deveRetornar200ComListaPaginada() throws Exception {
            var page = new PageImpl<>(List.of(buildSubscription()));
            when(listSubscriptionsUseCase.execute(any(), any(Pageable.class))).thenReturn(page);

            mockMvc.perform(get("/api/admin/subscriptions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].status").value("ACTIVE"))
                    .andExpect(jsonPath("$.data.content[0].planPeriod").value("MONTHLY"));
        }

        @Test
        @DisplayName("deve filtrar por status quando parametro fornecido")
        void deveFiltrarPorStatus() throws Exception {
            var subscription = buildSubscription();
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            var page = new PageImpl<>(List.of(subscription));
            when(listSubscriptionsUseCase.execute(eq(SubscriptionStatus.EXPIRED), any(Pageable.class)))
                    .thenReturn(page);

            mockMvc.perform(get("/api/admin/subscriptions?status=expired"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[0].status").value("EXPIRED"));
        }
    }

    @Nested
    @DisplayName("GET /api/admin/subscriptions/summary")
    class GetSummary {

        @Test
        @DisplayName("deve retornar 200 com contagens por status")
        void deveRetornar200ComSumario() throws Exception {
            Map<SubscriptionStatus, Long> counts = new EnumMap<>(SubscriptionStatus.class);
            counts.put(SubscriptionStatus.ACTIVE, 5L);
            counts.put(SubscriptionStatus.EXPIRED, 2L);
            counts.put(SubscriptionStatus.CANCELLED, 1L);
            when(summaryUseCase.execute()).thenReturn(counts);

            mockMvc.perform(get("/api/admin/subscriptions/summary"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalActive").value(5))
                    .andExpect(jsonPath("$.data.totalExpired").value(2))
                    .andExpect(jsonPath("$.data.totalCancelled").value(1));
        }
    }

    @Nested
    @DisplayName("PATCH /api/admin/subscriptions/{id}/status")
    class UpdateStatus {

        @Test
        @DisplayName("deve retornar 200 com assinatura atualizada")
        void deveRetornar200AoAtualizarStatus() throws Exception {
            var updated = buildSubscription();
            updated.setStatus(SubscriptionStatus.CANCELLED);
            when(updateStatusUseCase.execute(eq(SUBSCRIPTION_ID), eq(SubscriptionStatus.CANCELLED)))
                    .thenReturn(updated);

            mockMvc.perform(patch("/api/admin/subscriptions/" + SUBSCRIPTION_ID + "/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\":\"CANCELLED\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("CANCELLED"));
        }

        @Test
        @DisplayName("deve retornar 400 quando status ausente")
        void deveRetornar400QuandoStatusAusente() throws Exception {
            mockMvc.perform(patch("/api/admin/subscriptions/" + SUBSCRIPTION_ID + "/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\":\"\"}"))
                    .andExpect(status().isBadRequest());
        }
    }
}
