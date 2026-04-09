package com.mangareader.application.manga.usecase.admin;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
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
@DisplayName("DeleteTitleUseCase")
class DeleteTitleUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private DeleteTitleUseCase deleteTitleUseCase;

    @Test
    @DisplayName("Deve excluir título existente")
    void deveExcluirTituloExistente() {
        Title title = Title.builder().id("title-1").name("Test").build();
        when(titleRepository.findById("title-1")).thenReturn(Optional.of(title));

        deleteTitleUseCase.execute("title-1");

        verify(titleRepository).deleteById("title-1");
    }

    @Test
    @DisplayName("Deve lançar exceção quando título não existe")
    void deveLancarExcecaoQuandoNaoExiste() {
        when(titleRepository.findById("invalid")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deleteTitleUseCase.execute("invalid"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Title");
    }
}
