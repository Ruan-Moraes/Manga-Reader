package com.mangareader.application.payment.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.payment.port.PaymentRepositoryPort;
import com.mangareader.domain.payment.entity.Payment;
import com.mangareader.domain.payment.valueobject.PaymentStatus;

@ExtendWith(MockitoExtension.class)
@DisplayName("ListPaymentsUseCase")
class ListPaymentsUseCaseTest {

    @Mock
    private PaymentRepositoryPort paymentRepository;

    @InjectMocks
    private ListPaymentsUseCase useCase;

    @Test
    @DisplayName("Deve listar todos os pagamentos quando status for null")
    void deveListarTodosSemFiltro() {
        var page = new PageImpl<>(List.of(Payment.builder().build()));
        Pageable pageable = PageRequest.of(0, 20);
        when(paymentRepository.findAll(pageable)).thenReturn(page);

        var result = useCase.execute(null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(paymentRepository).findAll(pageable);
        verifyNoMoreInteractions(paymentRepository);
    }

    @Test
    @DisplayName("Deve filtrar por status quando informado")
    void deveFiltrarPorStatus() {
        var page = new PageImpl<>(List.of(Payment.builder().status(PaymentStatus.COMPLETED).build()));
        Pageable pageable = PageRequest.of(0, 20);
        when(paymentRepository.findByStatus(PaymentStatus.COMPLETED, pageable)).thenReturn(page);

        var result = useCase.execute(PaymentStatus.COMPLETED, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(paymentRepository).findByStatus(PaymentStatus.COMPLETED, pageable);
        verifyNoMoreInteractions(paymentRepository);
    }
}
