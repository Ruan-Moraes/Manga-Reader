package com.mangareader.presentation.subscription.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.subscription.usecase.CreateGiftCodeUseCase;
import com.mangareader.application.subscription.usecase.CreateSubscriptionUseCase;
import com.mangareader.application.subscription.usecase.GetMySubscriptionHistoryUseCase;
import com.mangareader.application.subscription.usecase.GetMySubscriptionUseCase;
import com.mangareader.application.subscription.usecase.GetSubscriptionPlansUseCase;
import com.mangareader.application.subscription.usecase.RedeemGiftCodeUseCase;
import com.mangareader.domain.subscription.entity.GiftCode;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.GiftCodeStatus;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;

@WebMvcTest(SubscriptionController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("SubscriptionController")
class SubscriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private GetSubscriptionPlansUseCase getPlansUseCase;

    @MockitoBean
    private CreateSubscriptionUseCase createSubscriptionUseCase;

    @MockitoBean
    private CreateGiftCodeUseCase createGiftCodeUseCase;

    @MockitoBean
    private RedeemGiftCodeUseCase redeemGiftCodeUseCase;

    @MockitoBean
    private GetMySubscriptionUseCase getMySubscriptionUseCase;

    @MockitoBean
    private GetMySubscriptionHistoryUseCase getMySubscriptionHistoryUseCase;

    private static final UUID PLAN_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();

    private static Authentication mockAuth() {
        return new UsernamePasswordAuthenticationToken(USER_ID, null, List.of());
    }

    private static SubscriptionPlan buildPlan() {
        return SubscriptionPlan.builder()
                .id(PLAN_ID)
                .period(SubscriptionPeriod.MONTHLY)
                .priceInCents(1990L)
                .description("Mensal")
                .features(List.of("HD", "Offline"))
                .build();
    }

    @Nested
    @DisplayName("GET /api/subscription-plans")
    class GetPlans {

        @Test
        @DisplayName("Deve retornar 200 com lista de planos")
        void deveRetornar200ComPlanos() throws Exception {
            when(getPlansUseCase.execute()).thenReturn(List.of(buildPlan()));

            mockMvc.perform(get("/api/subscription-plans"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].period").value("MONTHLY"))
                    .andExpect(jsonPath("$.data[0].priceInCents").value(1990));
        }
    }

    @Nested
    @DisplayName("POST /api/subscriptions")
    class CreateSubscription {

        @Test
        @DisplayName("Deve retornar 201 com assinatura criada")
        void deveRetornar201() throws Exception {
            var plan = buildPlan();
            var subscription = Subscription.builder()
                    .id(UUID.randomUUID())
                    .userId(USER_ID)
                    .plan(plan)
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusMonths(1))
                    .status(SubscriptionStatus.ACTIVE)
                    .build();
            when(createSubscriptionUseCase.execute(any(), any())).thenReturn(subscription);

            mockMvc.perform(post("/api/subscriptions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"planId\": \"" + PLAN_ID + "\"}")
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.status").value("ACTIVE"));
        }
    }

    @Nested
    @DisplayName("POST /api/subscriptions/gift")
    class CreateGiftCode {

        @Test
        @DisplayName("Deve retornar 201 com gift code criado")
        void deveRetornar201() throws Exception {
            var giftCode = GiftCode.builder()
                    .id(UUID.randomUUID())
                    .code("test-code-uuid")
                    .plan(buildPlan())
                    .senderUserId(USER_ID)
                    .recipientEmail("friend@email.com")
                    .expiresAt(LocalDateTime.now().plusYears(1))
                    .status(GiftCodeStatus.PENDING)
                    .build();
            when(createGiftCodeUseCase.execute(any(), any(), any())).thenReturn(giftCode);

            mockMvc.perform(post("/api/subscriptions/gift")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"planId\": \"" + PLAN_ID + "\", \"recipientEmail\": \"friend@email.com\"}")
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.code").value("test-code-uuid"))
                    .andExpect(jsonPath("$.data.recipientEmail").value("friend@email.com"));
        }
    }

    @Nested
    @DisplayName("POST /api/subscriptions/redeem")
    class RedeemGiftCode {

        @Test
        @DisplayName("Deve retornar 201 com assinatura gerada pelo resgate")
        void deveRetornar201() throws Exception {
            var plan = buildPlan();
            var subscription = Subscription.builder()
                    .id(UUID.randomUUID())
                    .userId(USER_ID)
                    .plan(plan)
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusMonths(1))
                    .status(SubscriptionStatus.ACTIVE)
                    .build();
            when(redeemGiftCodeUseCase.execute(any(), any())).thenReturn(subscription);

            mockMvc.perform(post("/api/subscriptions/redeem")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\": \"valid-code-uuid\"}")
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.status").value("ACTIVE"));
        }
    }
}
