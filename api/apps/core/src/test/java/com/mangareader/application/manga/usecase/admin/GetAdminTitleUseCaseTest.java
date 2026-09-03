package com.mangareader.application.manga.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetAdminTitleUseCase")
class GetAdminTitleUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private GetAdminTitleUseCase useCase;

    @Test
    @DisplayName("Retorna título quando encontrado")
    void retornaQuandoEncontrado() {
        Title title = mock(Title.class);
        when(titleRepository.findById("t1")).thenReturn(Optional.of(title));

        assertThat(useCase.execute("t1")).isSameAs(title);
    }

    @Test
    @DisplayName("Lança ResourceNotFoundException quando ausente")
    void lancaQuandoAusente() {
        when(titleRepository.findById("x")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute("x"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
