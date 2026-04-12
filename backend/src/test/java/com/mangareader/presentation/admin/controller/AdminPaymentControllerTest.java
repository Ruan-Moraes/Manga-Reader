package com.mangareader.presentation.admin.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
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
import com.mangareader.application.payment.usecase.admin.GetFinancialSummaryUseCase;
import com.mangareader.application.payment.usecase.admin.GetFinancialSummaryUseCase.FinancialSummary;
import com.mangareader.application.payment.usecase.admin.GetPaymentDetailsUseCase;
import com.mangareader.application.payment.usecase.admin.GetRevenueTimeSeriesUseCase;
import com.mangareader.application.payment.usecase.admin.ListPaymentsUseCase;
import com.mangareader.application.payment.usecase.admin.UpdatePaymentStatusUseCase;
import com.mangareader.domain.payment.entity.Payment;
import com.mangareader.domain.payment.valueobject.PaymentStatus;

@WebMvcTest(AdminPaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminPaymentController")
class AdminPaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private ListPaymentsUseCase listPaymentsUseCase;

    @MockitoBean
    private GetPaymentDetailsUseCase getPaymentDetailsUseCase;

    @MockitoBean
    private UpdatePaymentStatusUseCase updatePaymentStatusUseCase;

    @MockitoBean
    private GetFinancialSummaryUseCase getFinancialSummaryUseCase;

    @MockitoBean
    private GetRevenueTimeSeriesUseCase getRevenueTimeSeriesUseCase;

    private final UUID PAYMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000010");
    private final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000020");

    private Payment buildPayment() {
        return Payment.builder()
                .id(PAYMENT_ID)
                .userId(USER_ID)
                .amount(new BigDecimal("100.50"))
                .currency("BRL")
                .status(PaymentStatus.PENDING)
                .paymentMethod("PIX")
                .description("Ingresso evento")
                .referenceType("EVENT_TICKET")
                .referenceId("event-1")
                .build();
    }

    @Test
    @DisplayName("GET /api/admin/payments — deve retornar 200 com lista paginada")
    void deveRetornar200ComListaPaginada() throws Exception {
        var page = new PageImpl<>(List.of(buildPayment()));
        when(listPaymentsUseCase.execute(any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/admin/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].status").value("PENDING"))
                .andExpect(jsonPath("$.data.content[0].amount").value(100.50));
    }

    @Test
    @DisplayName("GET /api/admin/payments?status=COMPLETED — deve repassar filtro ao use case")
    void deveFiltrarPorStatus() throws Exception {
        var completedPayment = buildPayment();
        completedPayment.setStatus(PaymentStatus.COMPLETED);
        var page = new PageImpl<>(List.of(completedPayment));
        when(listPaymentsUseCase.execute(eq(PaymentStatus.COMPLETED), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/admin/payments?status=completed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].status").value("COMPLETED"));
    }

    @Test
    @DisplayName("GET /api/admin/payments/{id} — deve retornar 200 com detalhes")
    void deveRetornar200ComDetalhes() throws Exception {
        when(getPaymentDetailsUseCase.execute(PAYMENT_ID)).thenReturn(buildPayment());

        mockMvc.perform(get("/api/admin/payments/" + PAYMENT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(PAYMENT_ID.toString()))
                .andExpect(jsonPath("$.data.paymentMethod").value("PIX"));
    }

    @Test
    @DisplayName("PATCH /api/admin/payments/{id}/status — deve retornar 200")
    void deveRetornar200AoAtualizarStatus() throws Exception {
        var updated = buildPayment();
        updated.setStatus(PaymentStatus.COMPLETED);
        when(updatePaymentStatusUseCase.execute(eq(PAYMENT_ID), eq(PaymentStatus.COMPLETED)))
                .thenReturn(updated);

        mockMvc.perform(patch("/api/admin/payments/" + PAYMENT_ID + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "COMPLETED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("GET /api/admin/payments/summary — deve retornar 200 com agregações")
    void deveRetornar200ComResumoFinanceiro() throws Exception {
        Map<PaymentStatus, Long> counts = new EnumMap<>(PaymentStatus.class);
        counts.put(PaymentStatus.PENDING, 2L);
        counts.put(PaymentStatus.COMPLETED, 5L);
        counts.put(PaymentStatus.FAILED, 1L);
        counts.put(PaymentStatus.REFUNDED, 0L);

        Map<PaymentStatus, BigDecimal> amounts = new EnumMap<>(PaymentStatus.class);
        amounts.put(PaymentStatus.PENDING, new BigDecimal("50.00"));
        amounts.put(PaymentStatus.COMPLETED, new BigDecimal("250.00"));
        amounts.put(PaymentStatus.FAILED, new BigDecimal("10.00"));
        amounts.put(PaymentStatus.REFUNDED, BigDecimal.ZERO);

        var summary = new FinancialSummary(8L, new BigDecimal("250.00"), new BigDecimal("50.00"), counts, amounts);
        when(getFinancialSummaryUseCase.execute()).thenReturn(summary);

        mockMvc.perform(get("/api/admin/payments/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalPayments").value(8))
                .andExpect(jsonPath("$.data.totalRevenue").value(250.00))
                .andExpect(jsonPath("$.data.pendingRevenue").value(50.00))
                .andExpect(jsonPath("$.data.countsByStatus.COMPLETED").value(5));
    }
}
