package com.mangareader.aggregator.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.mangareader.aggregator.scheduling.TitleRatingReconciliationJob;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminReconcileController")
class AdminReconcileControllerTest {
    @Mock private TitleRatingReconciliationJob reconciliationJob;

    @Test
    @DisplayName("Token correto: dispara reconciliação e retorna 200 com a contagem")
    void tokenCorretoDispara() {
        when(reconciliationJob.reconcile()).thenReturn(42);
        var controller = new AdminReconcileController(reconciliationJob, "s3nh4");

        var response = controller.reconcile("s3nh4");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("reconciled", 42);
        verify(reconciliationJob).reconcile();
    }

    @Test
    @DisplayName("Token errado: 401 e não dispara")
    void tokenErrado() {
        var controller = new AdminReconcileController(reconciliationJob, "s3nh4");

        var response = controller.reconcile("errado");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(reconciliationJob, never()).reconcile();
    }

    @Test
    @DisplayName("Sem token no header: 401")
    void semToken() {
        var controller = new AdminReconcileController(reconciliationJob, "s3nh4");

        assertThat(controller.reconcile(null).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(reconciliationJob, never()).reconcile();
    }

    @Test
    @DisplayName("Token não configurado: endpoint desativado (503)")
    void tokenNaoConfigurado() {
        var controller = new AdminReconcileController(reconciliationJob, "");

        var response = controller.reconcile("qualquer");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        verify(reconciliationJob, never()).reconcile();
    }
}
