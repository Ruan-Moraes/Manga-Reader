package com.mangareader.trending.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.mangareader.trending.application.RecalculateTrendingUseCase;

class AdminReconcileControllerTest {
    private final RecalculateTrendingUseCase useCase = mock(RecalculateTrendingUseCase.class);

    @Test
    void returnsServiceUnavailableWhenTokenIsNotConfigured() {
        var response = new AdminReconcileController(useCase, "").reconcile("anything");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    void returnsUnauthorizedForMissingOrInvalidToken() {
        var controller = new AdminReconcileController(useCase, "secret");

        assertThat(controller.reconcile(null).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(controller.reconcile("invalid").getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void executesReconciliationForValidToken() {
        when(useCase.execute()).thenReturn(7);

        var response = new AdminReconcileController(useCase, "secret").reconcile("secret");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("titlesProcessed", 7);
        verify(useCase).execute();
    }
}
