package com.mangareader.application.library.usecase;

import static org.mockito.Mockito.verify;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.library.port.LibraryRepositoryPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("RemoveFromLibraryUseCase")
class RemoveFromLibraryUseCaseTest {

    @Mock
    private LibraryRepositoryPort libraryRepository;

    @InjectMocks
    private RemoveFromLibraryUseCase removeFromLibraryUseCase;

    @Test
    @DisplayName("Deve delegar remoção ao repositório com userId e titleId corretos")
    void deveDelegarRemocaoAoRepositorio() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String titleId = "title-abc123";

        // Act
        removeFromLibraryUseCase.execute(userId, titleId);

        // Assert
        verify(libraryRepository).deleteByUserIdAndTitleId(userId, titleId);
    }
}
