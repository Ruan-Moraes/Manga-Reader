package com.mangareader.application.user.usecase;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
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

import static org.assertj.core.api.Assertions.assertThat;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecordViewHistoryUseCase")
class RecordViewHistoryUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private ViewHistoryRepositoryPort viewHistoryRepository;

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private RecordViewHistoryUseCase recordViewHistoryUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc-123";

    private User buildUser(VisibilitySetting historyVis) {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .viewHistoryVisibility(historyVis)
                .build();
    }

    @Nested
    @DisplayName("Criação de nova entrada")
    class NovaEntrada {

        @Test
        @DisplayName("Deve criar nova entrada de histórico quando não existe")
        void deveCriarNovaEntrada() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(VisibilitySetting.PUBLIC)));
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(
                    Title.builder().id(TITLE_ID).name("Solo Leveling").cover("cover.jpg").build()));
            when(viewHistoryRepository.findByUserIdAndTitleId(USER_ID.toString(), TITLE_ID))
                    .thenReturn(Optional.empty());

            recordViewHistoryUseCase.execute(USER_ID, TITLE_ID);

            ArgumentCaptor<ViewHistory> captor = ArgumentCaptor.forClass(ViewHistory.class);
            verify(viewHistoryRepository).save(captor.capture());
            assertThat(captor.getValue().getUserId()).isEqualTo(USER_ID.toString());
            assertThat(captor.getValue().getTitleId()).isEqualTo(TITLE_ID);
            assertThat(captor.getValue().getTitleName()).isEqualTo("Solo Leveling");
            assertThat(captor.getValue().getTitleCover()).isEqualTo("cover.jpg");
        }
    }

    @Nested
    @DisplayName("Atualização de entrada existente (upsert)")
    class Upsert {

        @Test
        @DisplayName("Deve atualizar viewedAt quando entrada já existe")
        void deveAtualizarViewedAtQuandoExiste() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(VisibilitySetting.PUBLIC)));
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(
                    Title.builder().id(TITLE_ID).name("Solo Leveling").build()));

            ViewHistory existing = ViewHistory.builder()
                    .id("vh-existing")
                    .userId(USER_ID.toString())
                    .titleId(TITLE_ID)
                    .titleName("Solo Leveling")
                    .viewedAt(LocalDateTime.of(2025, 1, 1, 0, 0))
                    .build();
            when(viewHistoryRepository.findByUserIdAndTitleId(USER_ID.toString(), TITLE_ID))
                    .thenReturn(Optional.of(existing));

            recordViewHistoryUseCase.execute(USER_ID, TITLE_ID);

            verify(viewHistoryRepository).save(existing);
            assertThat(existing.getViewedAt()).isAfter(LocalDateTime.of(2025, 1, 1, 0, 0));
        }
    }

    @Nested
    @DisplayName("DO_NOT_TRACK")
    class DoNotTrack {

        @Test
        @DisplayName("Deve ignorar registro quando visibilidade é DO_NOT_TRACK")
        void deveIgnorarQuandoDoNotTrack() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(VisibilitySetting.DO_NOT_TRACK)));

            recordViewHistoryUseCase.execute(USER_ID, TITLE_ID);

            verify(viewHistoryRepository, never()).save(any());
            verify(viewHistoryRepository, never()).findByUserIdAndTitleId(any(), any());
        }
    }
}
