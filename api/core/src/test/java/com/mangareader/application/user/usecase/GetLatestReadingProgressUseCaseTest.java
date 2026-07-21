package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.user.port.ReadingProgressRepositoryPort;
import com.mangareader.domain.user.entity.ReadingProgress;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetLatestReadingProgressUseCase")
class GetLatestReadingProgressUseCaseTest {

    @Mock
    private ReadingProgressRepositoryPort readingProgressRepository;

    @InjectMocks
    private GetLatestReadingProgressUseCase useCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc-123";

    @Test
    @DisplayName("Deve retornar o progresso mais recente quando existe")
    void deveRetornarProgressoQuandoExiste() {
        ReadingProgress progress = ReadingProgress.builder()
                .id("rp-1").userId(USER_ID.toString()).titleId(TITLE_ID).chapterNumber("5")
                .currentPage(10).totalPages(20).completed(false).build();
        when(readingProgressRepository.findLatestByUserIdAndTitleId(USER_ID.toString(), TITLE_ID))
                .thenReturn(Optional.of(progress));

        Optional<ReadingProgress> result = useCase.execute(USER_ID, TITLE_ID);

        assertThat(result).contains(progress);
    }

    @Test
    @DisplayName("Deve retornar vazio quando não há progresso registrado")
    void deveRetornarVazioQuandoNaoExiste() {
        when(readingProgressRepository.findLatestByUserIdAndTitleId(USER_ID.toString(), TITLE_ID))
                .thenReturn(Optional.empty());

        Optional<ReadingProgress> result = useCase.execute(USER_ID, TITLE_ID);

        assertThat(result).isEmpty();
    }
}
