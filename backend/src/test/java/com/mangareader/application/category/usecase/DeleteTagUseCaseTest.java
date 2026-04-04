package com.mangareader.application.category.usecase;

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

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeleteTagUseCase")
class DeleteTagUseCaseTest {

    @Mock
    private TagRepositoryPort tagRepository;

    @InjectMocks
    private DeleteTagUseCase useCase;

    @Test
    @DisplayName("Deve deletar tag com sucesso")
    void deveDeletarTagComSucesso() {
        when(tagRepository.findById(1L))
                .thenReturn(Optional.of(Tag.builder().id(1L).label("Acao").build()));

        useCase.execute(1L);

        verify(tagRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Deve lancar excecao quando tag nao encontrada")
    void deveLancarExcecaoQuandoTagNaoEncontrada() {
        when(tagRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
