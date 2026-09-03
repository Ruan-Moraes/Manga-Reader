package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.ReadingProgressRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.ReadingProgress;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("SaveReadingProgressUseCase")
class SaveReadingProgressUseCaseTest {

    @Mock
    private ReadingProgressRepositoryPort readingProgressRepository;

    @Mock
    private TitleRepositoryPort titleRepository;

    @Mock
    private RecordChapterReadUseCase recordChapterReadUseCase;

    @InjectMocks
    private SaveReadingProgressUseCase useCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc-123";
    private final String CHAPTER = "12";

    private void stubTitleExists() {
        when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(
                Title.builder().id(TITLE_ID).name(LocalizedString.ofDefault("Solo Leveling")).build()));
    }

    private SaveReadingProgressUseCase.SaveProgressInput input(int page, int total, boolean completed) {
        return new SaveReadingProgressUseCase.SaveProgressInput(USER_ID, TITLE_ID, CHAPTER, page, total, completed);
    }

    @Test
    @DisplayName("Deve salvar progresso novo sem conclusão e não registrar capítulo lido")
    void deveSalvarProgressoSemConclusao() {
        stubTitleExists();
        when(readingProgressRepository.findByUserIdAndTitleIdAndChapterNumber(USER_ID.toString(), TITLE_ID, CHAPTER))
                .thenReturn(Optional.empty());
        when(readingProgressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReadingProgress result = useCase.execute(input(5, 20, false));

        ArgumentCaptor<ReadingProgress> captor = ArgumentCaptor.forClass(ReadingProgress.class);
        verify(readingProgressRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(USER_ID.toString());
        assertThat(captor.getValue().getTitleId()).isEqualTo(TITLE_ID);
        assertThat(captor.getValue().getChapterNumber()).isEqualTo(CHAPTER);
        assertThat(captor.getValue().getCurrentPage()).isEqualTo(5);
        assertThat(captor.getValue().getTotalPages()).isEqualTo(20);
        assertThat(captor.getValue().isCompleted()).isFalse();
        assertThat(result.isCompleted()).isFalse();

        verify(recordChapterReadUseCase, never()).execute(any(), any(), any());
    }

    @Test
    @DisplayName("Deve atualizar progresso existente (upsert) sem duplicar documento")
    void deveAtualizarProgressoExistente() {
        stubTitleExists();
        ReadingProgress existing = ReadingProgress.builder()
                .id("rp-1").userId(USER_ID.toString()).titleId(TITLE_ID).chapterNumber(CHAPTER)
                .currentPage(3).totalPages(20).completed(false).build();
        when(readingProgressRepository.findByUserIdAndTitleIdAndChapterNumber(USER_ID.toString(), TITLE_ID, CHAPTER))
                .thenReturn(Optional.of(existing));
        when(readingProgressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        useCase.execute(input(9, 20, false));

        ArgumentCaptor<ReadingProgress> captor = ArgumentCaptor.forClass(ReadingProgress.class);
        verify(readingProgressRepository).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo("rp-1");
        assertThat(captor.getValue().getCurrentPage()).isEqualTo(9);
    }

    @Test
    @DisplayName("Deve disparar registro de capítulo lido quando conclusão transiciona false -> true")
    void deveDispararCapituloLidoNaConclusao() {
        stubTitleExists();
        when(readingProgressRepository.findByUserIdAndTitleIdAndChapterNumber(USER_ID.toString(), TITLE_ID, CHAPTER))
                .thenReturn(Optional.empty());
        when(readingProgressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        useCase.execute(input(20, 20, true));

        verify(recordChapterReadUseCase, times(1)).execute(USER_ID, TITLE_ID, CHAPTER);
    }

    @Test
    @DisplayName("Não deve redisparar registro de capítulo lido quando já estava concluído")
    void naoDeveRedispararQuandoJaConcluido() {
        stubTitleExists();
        ReadingProgress existing = ReadingProgress.builder()
                .id("rp-1").userId(USER_ID.toString()).titleId(TITLE_ID).chapterNumber(CHAPTER)
                .currentPage(20).totalPages(20).completed(true).build();
        when(readingProgressRepository.findByUserIdAndTitleIdAndChapterNumber(USER_ID.toString(), TITLE_ID, CHAPTER))
                .thenReturn(Optional.of(existing));
        when(readingProgressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        useCase.execute(input(20, 20, true));

        verify(recordChapterReadUseCase, never()).execute(any(), any(), any());
    }

    @Nested
    @DisplayName("Validações")
    class Validacoes {

        @Test
        void rejectsCurrentPageBeyondTheChapterLength() {
            assertThatThrownBy(() -> useCase.execute(input(21, 20, false)))
                    .isInstanceOf(BusinessRuleException.class);

            verify(titleRepository, never()).findById(any());
            verify(readingProgressRepository, never()).save(any());
        }

        @Test
        void rejectsCompletionBeforeTheLastPage() {
            assertThatThrownBy(() -> useCase.execute(input(5, 20, true)))
                    .isInstanceOf(BusinessRuleException.class);

            verify(titleRepository, never()).findById(any());
            verify(readingProgressRepository, never()).save(any());
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando título não existe")
        void deveLancarQuandoTituloNaoExiste() {
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> useCase.execute(input(1, 20, false)))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(readingProgressRepository, never()).save(any());
            verify(recordChapterReadUseCase, never()).execute(any(), any(), any());
        }
    }
}
