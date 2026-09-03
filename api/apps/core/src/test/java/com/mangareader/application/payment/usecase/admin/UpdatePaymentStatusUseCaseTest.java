package com.mangareader.application.payment.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.payment.port.PaymentRepositoryPort;
import com.mangareader.domain.payment.entity.Payment;
import com.mangareader.domain.payment.valueobject.PaymentStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdatePaymentStatusUseCase")
class UpdatePaymentStatusUseCaseTest {

    @Mock
    private PaymentRepositoryPort paymentRepository;

    @InjectMocks
    private UpdatePaymentStatusUseCase useCase;

    @Test
    @DisplayName("Deve definir paidAt ao marcar como COMPLETED")
    void deveDefinirPaidAtQuandoCompleted() {
        UUID id = UUID.randomUUID();
        Payment payment = Payment.builder().id(id).status(PaymentStatus.PENDING).build();
        when(paymentRepository.findById(id)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = useCase.execute(id, PaymentStatus.COMPLETED);

        assertThat(result.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(result.getPaidAt()).isNotNull();
    }

    @Test
    @DisplayName("Não deve sobrescrever paidAt quando já estiver definido")
    void naoDeveSobrescreverPaidAtExistente() {
        UUID id = UUID.randomUUID();
        LocalDateTime existing = LocalDateTime.of(2026, 1, 1, 12, 0);
        Payment payment = Payment.builder()
                .id(id)
                .status(PaymentStatus.PENDING)
                .paidAt(existing)
                .build();
        when(paymentRepository.findById(id)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = useCase.execute(id, PaymentStatus.COMPLETED);

        assertThat(result.getPaidAt()).isEqualTo(existing);
    }

    @Test
    @DisplayName("Deve atualizar status para FAILED sem alterar paidAt")
    void deveAtualizarParaFailed() {
        UUID id = UUID.randomUUID();
        Payment payment = Payment.builder().id(id).status(PaymentStatus.PENDING).build();
        when(paymentRepository.findById(id)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = useCase.execute(id, PaymentStatus.FAILED);

        assertThat(result.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(result.getPaidAt()).isNull();
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando pagamento não existe")
    void deveLancarQuandoNaoEncontrado() {
        UUID id = UUID.randomUUID();
        when(paymentRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(id, PaymentStatus.COMPLETED))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
