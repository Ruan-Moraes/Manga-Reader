package com.mangareader.application.library.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserLibraryUseCase")
class GetUserLibraryUseCaseTest {

    @Mock
    private LibraryRepositoryPort libraryRepository;

    @InjectMocks
    private GetUserLibraryUseCase getUserLibraryUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    @Test
    @DisplayName("Deve retornar página de mangás salvos do usuário")
    void deveRetornarPaginaDeMangasSalvos() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        List<SavedManga> items = List.of(
                SavedManga.builder().titleId("t1").name("Naruto").list(ReadingListType.LENDO).build(),
                SavedManga.builder().titleId("t2").name("One Piece").list(ReadingListType.QUERO_LER).build()
        );
        Page<SavedManga> page = new PageImpl<>(items, pageable, 2);

        when(libraryRepository.findByUserId(USER_ID, pageable)).thenReturn(page);

        // Act
        Page<SavedManga> result = getUserLibraryUseCase.execute(USER_ID, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
        verify(libraryRepository).findByUserId(USER_ID, pageable);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando biblioteca está vazia")
    void deveRetornarPaginaVaziaQuandoBibliotecaVazia() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<SavedManga> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(libraryRepository.findByUserId(USER_ID, pageable)).thenReturn(emptyPage);

        // Act
        Page<SavedManga> result = getUserLibraryUseCase.execute(USER_ID, pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
