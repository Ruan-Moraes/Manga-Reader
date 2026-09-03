package com.mangareader.application.author.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.application.author.usecase.CreateAuthorUseCase.CreateAuthorInput;
import com.mangareader.domain.author.entity.Author;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateAuthorUseCase")
class CreateAuthorUseCaseTest {

    @Mock
    private AuthorRepositoryPort authorRepository;

    @InjectMocks
    private CreateAuthorUseCase createAuthorUseCase;

    @Test
    @DisplayName("Deve criar autor derivando slug do nome")
    void deveCriarAutorComSlug() {
        when(authorRepository.existsBySlug(any())).thenReturn(false);
        when(authorRepository.save(any(Author.class))).thenAnswer(inv -> inv.getArgument(0));

        Author result = createAuthorUseCase.execute(
                new CreateAuthorInput("Eiichiro Oda", "Criador de One Piece", "JP"));

        assertThat(result.getName()).isEqualTo("Eiichiro Oda");
        assertThat(result.getSlug()).isEqualTo("eiichiro-oda");
        assertThat(result.getBio()).isEqualTo("Criador de One Piece");
        assertThat(result.getNationality()).isEqualTo("JP");
    }

    @Test
    @DisplayName("Deve anexar sufixo numérico quando slug já existe")
    void deveAnexarSufixoEmColisao() {
        when(authorRepository.existsBySlug("eiichiro-oda")).thenReturn(true);
        when(authorRepository.existsBySlug("eiichiro-oda-2")).thenReturn(false);
        when(authorRepository.save(any(Author.class))).thenAnswer(inv -> inv.getArgument(0));

        Author result = createAuthorUseCase.execute(
                new CreateAuthorInput("Eiichiro Oda", null, null));

        assertThat(result.getSlug()).isEqualTo("eiichiro-oda-2");
    }

    @Test
    @DisplayName("Deve persistir o autor via repositório com nome trimado")
    void devePersistirAutorTrimado() {
        when(authorRepository.existsBySlug(any())).thenReturn(false);
        when(authorRepository.save(any(Author.class))).thenAnswer(inv -> inv.getArgument(0));

        createAuthorUseCase.execute(new CreateAuthorInput("  Kentaro Miura  ", null, null));

        ArgumentCaptor<Author> captor = ArgumentCaptor.forClass(Author.class);
        verify(authorRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Kentaro Miura");
        assertThat(captor.getValue().getSlug()).isEqualTo("kentaro-miura");
    }
}
