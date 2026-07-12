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
import com.mangareader.application.library.usecase.ChangeReadingListUseCase.ChangeListInput;
import com.mangareader.application.shared.event.TitleCompletedEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChangeReadingListUseCase")
class ChangeReadingListUseCaseTest {

    @Mock
    private LibraryRepositoryPort libraryRepository;

    @Mock
    private EventPublisherPort eventPublisher;

    @InjectMocks
    private ChangeReadingListUseCase changeReadingListUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc123";

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve alterar lista de leitura de QUERO_LER para LENDO")
        void deveAlterarListaDeLeitura() {
            // Arrange
            ChangeListInput input = new ChangeListInput(USER_ID, TITLE_ID, ReadingListType.LENDO);
            SavedManga existing = SavedManga.builder()
                    .titleId(TITLE_ID)
                    .name("Naruto")
                    .list(ReadingListType.QUERO_LER)
                    .build();

            when(libraryRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID))
                    .thenReturn(Optional.of(existing));
            when(libraryRepository.save(any(SavedManga.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            SavedManga result = changeReadingListUseCase.execute(input);

            // Assert
            assertThat(result.getList()).isEqualTo(ReadingListType.LENDO);
        }

        @Test
        @DisplayName("Deve salvar alteração no repositório e emitir evento de atividade ao concluir")
        void deveSalvarAlteracaoNoRepositorio() {
            // Arrange
            ChangeListInput input = new ChangeListInput(USER_ID, TITLE_ID, ReadingListType.CONCLUIDO);
            SavedManga existing = SavedManga.builder()
                    .titleId(TITLE_ID)
                    .name("Naruto")
                    .cover("naruto.jpg")
                    .list(ReadingListType.LENDO)
                    .build();

            when(libraryRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID))
                    .thenReturn(Optional.of(existing));
            when(libraryRepository.save(any(SavedManga.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            changeReadingListUseCase.execute(input);

            // Assert
            ArgumentCaptor<SavedManga> captor = ArgumentCaptor.forClass(SavedManga.class);
            verify(libraryRepository).save(captor.capture());
            assertThat(captor.getValue().getList()).isEqualTo(ReadingListType.CONCLUIDO);

            ArgumentCaptor<TitleCompletedEvent> eventCaptor = ArgumentCaptor.forClass(TitleCompletedEvent.class);
            verify(eventPublisher).publish(org.mockito.ArgumentMatchers.eq("activity.title-completed"), eventCaptor.capture());
            assertThat(eventCaptor.getValue().titleId()).isEqualTo(TITLE_ID);
            assertThat(eventCaptor.getValue().titleName()).isEqualTo("Naruto");
        }

        @Test
        @DisplayName("Não deve reemitir evento quando o título já estava concluído")
        void naoReemiteEventoQuandoJaConcluido() {
            // Arrange
            ChangeListInput input = new ChangeListInput(USER_ID, TITLE_ID, ReadingListType.CONCLUIDO);
            SavedManga existing = SavedManga.builder()
                    .titleId(TITLE_ID)
                    .name("Naruto")
                    .list(ReadingListType.CONCLUIDO)
                    .build();

            when(libraryRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID))
                    .thenReturn(Optional.of(existing));
            when(libraryRepository.save(any(SavedManga.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            changeReadingListUseCase.execute(input);

            // Assert
            verify(eventPublisher, never()).publish(org.mockito.ArgumentMatchers.eq("activity.title-completed"), any());
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando mangá não está na biblioteca")
        void deveLancarExcecaoQuandoMangaNaoEstaNaBiblioteca() {
            // Arrange
            ChangeListInput input = new ChangeListInput(USER_ID, TITLE_ID, ReadingListType.LENDO);

            when(libraryRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> changeReadingListUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("SavedManga");

            verify(libraryRepository, never()).save(any());
        }
    }
}
