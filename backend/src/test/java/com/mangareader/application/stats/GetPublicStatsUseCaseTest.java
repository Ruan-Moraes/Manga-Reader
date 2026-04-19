package com.mangareader.application.stats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.stats.usecase.GetPublicStatsUseCase;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetPublicStatsUseCase")
class GetPublicStatsUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private GetPublicStatsUseCase useCase;

    @Test
    @DisplayName("Deve retornar totalTitles e totalChapters do repositório")
    void deveRetornarEstatisticasCorretas() {
        when(titleRepository.count()).thenReturn(250L);
        when(titleRepository.countTotalChapters()).thenReturn(4820L);

        var result = useCase.execute();

        assertThat(result.totalTitles()).isEqualTo(250L);
        assertThat(result.totalChapters()).isEqualTo(4820L);
    }

    @Test
    @DisplayName("Deve retornar zeros quando não há títulos")
    void deveRetornarZerosQuandoVazio() {
        when(titleRepository.count()).thenReturn(0L);
        when(titleRepository.countTotalChapters()).thenReturn(0L);

        var result = useCase.execute();

        assertThat(result.totalTitles()).isZero();
        assertThat(result.totalChapters()).isZero();
    }
}
