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

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateTagUseCase")
class CreateTagUseCaseTest {

    @Mock
    private TagRepositoryPort tagRepository;

    @InjectMocks
    private CreateTagUseCase useCase;

    @Test
    @DisplayName("Deve criar tag com sucesso")
    void deveCriarTagComSucesso() {
        when(tagRepository.findByLabelIgnoreCase("Acao")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> {
            Tag t = inv.getArgument(0);
            t.setId(1L);
            return t;
        });

        Tag result = useCase.execute("Acao");

        assertThat(result).isNotNull();
        assertThat(result.getLabel()).isEqualTo("Acao");
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Deve lancar excecao quando label esta em branco")
    void deveLancarExcecaoQuandoLabelEmBranco() {
        assertThatThrownBy(() -> useCase.execute("   "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("branco");
    }

    @Test
    @DisplayName("Deve lancar excecao quando label ja existe")
    void deveLancarExcecaoQuandoLabelDuplicada() {
        when(tagRepository.findByLabelIgnoreCase("Acao"))
                .thenReturn(Optional.of(Tag.builder().id(1L).label("Acao").build()));

        assertThatThrownBy(() -> useCase.execute("Acao"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("duplicada");
    }
}
