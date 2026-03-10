package com.mangareader.application.library.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.library.usecase.SaveToLibraryUseCase.SaveToLibraryInput;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.DuplicateResourceException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("SaveToLibraryUseCase")
class SaveToLibraryUseCaseTest {

    @Mock
    private LibraryRepositoryPort libraryRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private SaveToLibraryUseCase saveToLibraryUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc123";

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .role(UserRole.MEMBER)
                .build();
    }

    private Title buildTitle() {
        return Title.builder()
                .id(TITLE_ID)
                .name("Naruto")
                .cover("https://example.com/naruto.jpg")
                .type("Mangá")
                .build();
    }

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve salvar mangá na biblioteca com dados desnormalizados do título")
        void deveSalvarMangaNaBiblioteca() {
            // Arrange
            SaveToLibraryInput input = new SaveToLibraryInput(USER_ID, TITLE_ID, ReadingListType.QUERO_LER);

            when(libraryRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID)).thenReturn(Optional.empty());
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(buildTitle()));
            when(libraryRepository.save(any(SavedManga.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            SavedManga result = saveToLibraryUseCase.execute(input);

            // Assert
            assertThat(result.getTitleId()).isEqualTo(TITLE_ID);
            assertThat(result.getName()).isEqualTo("Naruto");
            assertThat(result.getCover()).isEqualTo("https://example.com/naruto.jpg");
            assertThat(result.getType()).isEqualTo("Mangá");
            assertThat(result.getList()).isEqualTo(ReadingListType.QUERO_LER);
        }

        @Test
        @DisplayName("Deve associar o usuário ao SavedManga")
        void deveAssociarUsuarioAoSavedManga() {
            // Arrange
            SaveToLibraryInput input = new SaveToLibraryInput(USER_ID, TITLE_ID, ReadingListType.LENDO);
            User user = buildUser();

            when(libraryRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID)).thenReturn(Optional.empty());
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(buildTitle()));
            when(libraryRepository.save(any(SavedManga.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            saveToLibraryUseCase.execute(input);

            // Assert
            ArgumentCaptor<SavedManga> captor = ArgumentCaptor.forClass(SavedManga.class);
            verify(libraryRepository).save(captor.capture());
            assertThat(captor.getValue().getUser()).isEqualTo(user);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar DuplicateResourceException quando título já está na biblioteca")
        void deveLancarExcecaoQuandoTituloJaExiste() {
            // Arrange
            SaveToLibraryInput input = new SaveToLibraryInput(USER_ID, TITLE_ID, ReadingListType.QUERO_LER);
            SavedManga existing = SavedManga.builder().titleId(TITLE_ID).build();

            when(libraryRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID))
                    .thenReturn(Optional.of(existing));

            // Act & Assert
            assertThatThrownBy(() -> saveToLibraryUseCase.execute(input))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining(TITLE_ID);

            verify(userRepository, never()).findById(any());
            verify(libraryRepository, never()).save(any());
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            // Arrange
            SaveToLibraryInput input = new SaveToLibraryInput(USER_ID, TITLE_ID, ReadingListType.QUERO_LER);

            when(libraryRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID)).thenReturn(Optional.empty());
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> saveToLibraryUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");

            verify(libraryRepository, never()).save(any());
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando título não existe")
        void deveLancarExcecaoQuandoTituloNaoExiste() {
            // Arrange
            SaveToLibraryInput input = new SaveToLibraryInput(USER_ID, TITLE_ID, ReadingListType.QUERO_LER);

            when(libraryRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID)).thenReturn(Optional.empty());
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> saveToLibraryUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Title");

            verify(libraryRepository, never()).save(any());
        }
    }
}
