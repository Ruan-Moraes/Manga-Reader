package com.mangareader.application.user.usecase;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static org.assertj.core.api.Assertions.assertThat;

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
import org.springframework.dao.DuplicateKeyException;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.UserChapterReadRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserChapterRead;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecordChapterReadUseCase")
class RecordChapterReadUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private UserChapterReadRepositoryPort userChapterReadRepository;

    @Mock
    private TitleRepositoryPort titleRepository;

    @Mock
    private UserProfileSettingsResolver profileSettingsResolver;

    @InjectMocks
    private RecordChapterReadUseCase useCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc-123";
    private final String CHAPTER = "12";

    private User stubUser(VisibilitySetting historyVis) {
        User user = User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .build();
        UserProfileSettings settings = UserProfileSettings.defaults(user);
        settings.setViewHistoryVisibility(historyVis);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(profileSettingsResolver.getOrDefault(user)).thenReturn(settings);

        return user;
    }

    private void stubTitleExists() {
        when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(
                Title.builder().id(TITLE_ID).name(LocalizedString.ofDefault("Solo Leveling")).build()));
    }

    @Test
    @DisplayName("Deve registrar leitura quando ainda não existe")
    void deveRegistrarLeitura() {
        stubUser(VisibilitySetting.PUBLIC);
        stubTitleExists();
        when(userChapterReadRepository.findByUserIdAndTitleIdAndChapterNumber(USER_ID.toString(), TITLE_ID, CHAPTER))
                .thenReturn(Optional.empty());

        useCase.execute(USER_ID, TITLE_ID, CHAPTER);

        ArgumentCaptor<UserChapterRead> captor = ArgumentCaptor.forClass(UserChapterRead.class);
        verify(userChapterReadRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(USER_ID.toString());
        assertThat(captor.getValue().getTitleId()).isEqualTo(TITLE_ID);
        assertThat(captor.getValue().getChapterNumber()).isEqualTo(CHAPTER);
    }

    @Test
    @DisplayName("Deve ser idempotente quando a leitura já existe (não salva)")
    void deveSerIdempotente() {
        stubUser(VisibilitySetting.PUBLIC);
        stubTitleExists();
        when(userChapterReadRepository.findByUserIdAndTitleIdAndChapterNumber(USER_ID.toString(), TITLE_ID, CHAPTER))
                .thenReturn(Optional.of(UserChapterRead.builder().id("ucr-1").build()));

        useCase.execute(USER_ID, TITLE_ID, CHAPTER);

        verify(userChapterReadRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve engolir DuplicateKeyException de corrida concorrente")
    void deveEngolirDuplicateKey() {
        stubUser(VisibilitySetting.PUBLIC);
        stubTitleExists();
        when(userChapterReadRepository.findByUserIdAndTitleIdAndChapterNumber(USER_ID.toString(), TITLE_ID, CHAPTER))
                .thenReturn(Optional.empty());
        when(userChapterReadRepository.save(any())).thenThrow(new DuplicateKeyException("dup"));

        useCase.execute(USER_ID, TITLE_ID, CHAPTER);

        verify(userChapterReadRepository).save(any());
    }

    @Nested
    @DisplayName("Validações")
    class Validacoes {

        @Test
        @DisplayName("Deve ignorar registro quando visibilidade é DO_NOT_TRACK")
        void deveIgnorarQuandoDoNotTrack() {
            stubUser(VisibilitySetting.DO_NOT_TRACK);

            useCase.execute(USER_ID, TITLE_ID, CHAPTER);

            verify(userChapterReadRepository, never()).save(any());
            verify(userChapterReadRepository, never())
                    .findByUserIdAndTitleIdAndChapterNumber(any(), any(), any());
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando título não existe")
        void deveLancarQuandoTituloNaoExiste() {
            stubUser(VisibilitySetting.PUBLIC);
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.empty());

            org.assertj.core.api.Assertions.assertThatThrownBy(
                            () -> useCase.execute(USER_ID, TITLE_ID, CHAPTER))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(userChapterReadRepository, never()).save(any());
        }
    }
}
