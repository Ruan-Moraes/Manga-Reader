package com.mangareader.application.payment.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

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
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetPaymentDetailsUseCase")
class GetPaymentDetailsUseCaseTest {

    @Mock
    private PaymentRepositoryPort paymentRepository;

    @InjectMocks
    private GetPaymentDetailsUseCase useCase;

    @Test
    @DisplayName("Deve retornar pagamento quando encontrado")
    void deveRetornarPagamento() {
        UUID id = UUID.randomUUID();
        Payment payment = Payment.builder().id(id).build();
        when(paymentRepository.findById(id)).thenReturn(Optional.of(payment));

        var result = useCase.execute(id);

        assertThat(result).isSameAs(payment);
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando pagamento não existe")
    void deveLancarQuandoNaoEncontrado() {
        UUID id = UUID.randomUUID();
        when(paymentRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
