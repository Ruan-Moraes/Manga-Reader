package com.mangareader.application.author.usecase;

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

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.application.author.usecase.UpdateAuthorUseCase.UpdateAuthorInput;
import com.mangareader.domain.author.entity.Author;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateAuthorUseCase")
class UpdateAuthorUseCaseTest {

    @Mock
    private AuthorRepositoryPort authorRepository;

    @InjectMocks
    private UpdateAuthorUseCase updateAuthorUseCase;

    @Test
    @DisplayName("Deve atualizar campos mantendo o slug inalterado")
    void deveAtualizarMantendoSlug() {
        Author existing = Author.builder()
                .id(1L).name("Oda").slug("oda").build();
        when(authorRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(authorRepository.save(any(Author.class))).thenAnswer(inv -> inv.getArgument(0));

        Author result = updateAuthorUseCase.execute(
                new UpdateAuthorInput(1L, "Eiichiro Oda", "bio nova", "JP"));

        assertThat(result.getName()).isEqualTo("Eiichiro Oda");
        assertThat(result.getBio()).isEqualTo("bio nova");
        assertThat(result.getNationality()).isEqualTo("JP");
        assertThat(result.getSlug()).isEqualTo("oda");
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando autor não existe")
    void deveLancarQuandoNaoExiste() {
        when(authorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateAuthorUseCase.execute(
                new UpdateAuthorInput(99L, "X", null, null)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Author");
    }
}
