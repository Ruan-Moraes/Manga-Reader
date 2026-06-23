package com.mangareader.application.manga.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.application.author.port.TitleAuthorRepositoryPort;
import com.mangareader.application.manga.usecase.admin.TitleAuthorAssignment;
import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.application.publisher.port.TitlePublisherRepositoryPort;
import com.mangareader.domain.author.entity.Author;
import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.domain.author.valueobject.AuthorRole;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("TitleAssociationWriter")
class TitleAssociationWriterTest {

    @Mock
    private AuthorRepositoryPort authorRepository;
    @Mock
    private PublisherRepositoryPort publisherRepository;
    @Mock
    private TitleAuthorRepositoryPort titleAuthorRepository;
    @Mock
    private TitlePublisherRepositoryPort titlePublisherRepository;

    @InjectMocks
    private TitleAssociationWriter writer;

    @Test
    @DisplayName("replaceAuthors limpa e regrava, resolvendo o autor e o papel")
    void replaceAuthorsRegrava() {
        var oda = Author.builder().id(1L).name("Oda").slug("oda").build();
        when(authorRepository.findById(1L)).thenReturn(Optional.of(oda));

        writer.replaceAuthors("t1", List.of(
                new TitleAuthorAssignment(1L, AuthorRole.AUTHOR),
                new TitleAuthorAssignment(1L, AuthorRole.ARTIST)));

        verify(titleAuthorRepository).deleteByTitleId("t1");

        ArgumentCaptor<TitleAuthor> captor = ArgumentCaptor.forClass(TitleAuthor.class);
        verify(titleAuthorRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(TitleAuthor::getRole)
                .containsExactly(AuthorRole.AUTHOR, AuthorRole.ARTIST);
    }

    @Test
    @DisplayName("replaceAuthors deduplica (authorId, role) repetidos")
    void replaceAuthorsDeduplica() {
        var oda = Author.builder().id(1L).name("Oda").slug("oda").build();
        when(authorRepository.findById(1L)).thenReturn(Optional.of(oda));

        writer.replaceAuthors("t1", List.of(
                new TitleAuthorAssignment(1L, AuthorRole.AUTHOR),
                new TitleAuthorAssignment(1L, AuthorRole.AUTHOR)));

        verify(titleAuthorRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("replaceAuthors com lista vazia apenas limpa")
    void replaceAuthorsVazioLimpa() {
        writer.replaceAuthors("t1", List.of());

        verify(titleAuthorRepository).deleteByTitleId("t1");
        verify(titleAuthorRepository, never()).save(any());
    }

    @Test
    @DisplayName("replaceAuthors lança ResourceNotFound quando autor não existe")
    void replaceAuthorsAutorInexistente() {
        when(authorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> writer.replaceAuthors("t1",
                List.of(new TitleAuthorAssignment(99L, AuthorRole.AUTHOR))))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Author");
    }

    @Test
    @DisplayName("replacePublishers limpa, deduplica e resolve editoras")
    void replacePublishersRegrava() {
        var shueisha = Publisher.builder().id(5L).name("Shueisha").slug("shueisha").build();
        when(publisherRepository.findById(5L)).thenReturn(Optional.of(shueisha));

        writer.replacePublishers("t1", List.of(5L, 5L));

        verify(titlePublisherRepository).deleteByTitleId("t1");
        verify(titlePublisherRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("clear limpa as duas junções")
    void clearLimpaTudo() {
        writer.clear("t1");

        verify(titleAuthorRepository).deleteByTitleId("t1");
        verify(titlePublisherRepository).deleteByTitleId("t1");
    }
}
