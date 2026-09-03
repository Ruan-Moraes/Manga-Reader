package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.ChapterRepositoryPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetChapterStatsUseCase")
class GetChapterStatsUseCaseTest {
    @Mock
    private ChapterRepositoryPort chapterRepository;

    @InjectMocks
    private GetChapterStatsUseCase useCase;

    @Test
    @DisplayName("Compõe contagem + último número por título")
    void compoeStats() {
        var ids = List.of("t1", "t2");
        when(chapterRepository.countByTitleIdIn(ids))
                .thenReturn(Map.of("t1", 3L, "t2", 1L));
        when(chapterRepository.latestChapterNumberByTitleIdIn(ids))
                .thenReturn(Map.of("t1", "10", "t2", "1"));

        var stats = useCase.execute(ids);

        assertThat(stats).containsEntry("t1", new ChapterStats(3L, "10"));
        assertThat(stats).containsEntry("t2", new ChapterStats(1L, "1"));
    }

    @Test
    @DisplayName("Título sem capítulos não aparece no mapa")
    void semCapitulosOmitido() {
        var ids = List.of("t1", "t-vazio");
        when(chapterRepository.countByTitleIdIn(ids))
                .thenReturn(Map.of("t1", 2L));
        when(chapterRepository.latestChapterNumberByTitleIdIn(ids))
                .thenReturn(Map.of("t1", "2"));

        var stats = useCase.execute(ids);

        assertThat(stats).containsOnlyKeys("t1");
        assertThat(stats.get("t1")).isEqualTo(new ChapterStats(2L, "2"));
    }

    @Test
    @DisplayName("Ids vazios retornam mapa vazio sem tocar o repositório")
    void idsVazios() {
        assertThat(useCase.execute(List.of())).isEmpty();
        verifyNoInteractions(chapterRepository);
    }

    @Test
    @DisplayName("Ids nulos retornam mapa vazio")
    void idsNulos() {
        assertThat(useCase.execute(null)).isEmpty();
        verify(chapterRepository, never()).countByTitleIdIn(null);
    }

    @Test
    @DisplayName("ChapterStats.EMPTY é zero/null")
    void emptyConstante() {
        assertThat(ChapterStats.EMPTY.chaptersCount()).isZero();
        assertThat(ChapterStats.EMPTY.latestChapterNumber()).isNull();
    }
}
