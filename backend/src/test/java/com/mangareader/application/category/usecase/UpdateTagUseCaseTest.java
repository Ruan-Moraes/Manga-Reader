package com.mangareader.application.category.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
@DisplayName("UpdateTagUseCase")
class UpdateTagUseCaseTest {

    @Mock
    private TagRepositoryPort tagRepository;

    @InjectMocks
    private UpdateTagUseCase useCase;

    @Test
    @DisplayName("Deve atualizar tag com sucesso")
    void deveAtualizarTagComSucesso() {
        Tag existing = Tag.builder().id(1L).label("Acao").build();
        when(tagRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(tagRepository.findByLabelIgnoreCase("Aventura")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> inv.getArgument(0));

        Tag result = useCase.execute(1L, "Aventura");

        assertThat(result.getLabel()).isEqualTo("Aventura");
    }

    @Test
    @DisplayName("Deve lancar excecao quando tag nao encontrada")
    void deveLancarExcecaoQuandoTagNaoEncontrada() {
        when(tagRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(999L, "Nova"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Deve lancar excecao quando novo label ja existe em outra tag")
    void deveLancarExcecaoQuandoLabelDuplicadaEmOutraTag() {
        Tag existing = Tag.builder().id(1L).label("Acao").build();
        Tag other = Tag.builder().id(2L).label("Aventura").build();
        when(tagRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(tagRepository.findByLabelIgnoreCase("Aventura")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> useCase.execute(1L, "Aventura"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("duplicada");
    }
}
