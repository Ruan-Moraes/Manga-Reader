package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.shared.event.ChapterReadEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.application.user.port.UserChapterReadRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserChapterRead;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.analytics.service.BehaviorEventRecorder;
import com.mangareader.domain.analytics.entity.BehaviorEventType;

import lombok.RequiredArgsConstructor;

/**
 * Registra a leitura de um capítulo no progresso do usuário.
 * <p>
 * Idempotente: se (userId, titleId, chapterNumber) já existe, não faz nada.
 * Não registra se viewHistoryVisibility == DO_NOT_TRACK (mesmo controle de
 * privacidade do histórico de visualização).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class RecordChapterReadUseCase {
    private final UserRepositoryPort userRepository;
    private final UserChapterReadRepositoryPort userChapterReadRepository;
    private final TitleRepositoryPort titleRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;
    private final EventPublisherPort eventPublisher;
    private final LocaleResolutionService localeResolver;
    private final BehaviorEventRecorder behaviorEventRecorder;

    public void execute(UUID userId, String titleId, String chapterNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        UserProfileSettings settings = profileSettingsResolver.getOrDefault(user);

        if (settings.getViewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK) {
            return;
        }

        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));

        String userIdStr = userId.toString();

        boolean alreadyRead = userChapterReadRepository
                .findByUserIdAndTitleIdAndChapterNumber(userIdStr, titleId, chapterNumber)
                .isPresent();

        if (alreadyRead) {
            return;
        }

        try {
            userChapterReadRepository.save(UserChapterRead.builder()
                    .userId(userIdStr)
                    .titleId(titleId)
                    .chapterNumber(chapterNumber)
                    .build());
        } catch (DataIntegrityViolationException ignored) {
            // Corrida: outra requisição registrou a mesma leitura entre o check e
            // o save (DuplicateKeyException) ou colidiu na própria transação
            // Mongo (WriteConflict, também traduzido para
            // DataIntegrityViolationException). O índice único garante
            // idempotência — nada a fazer.
            return;
        }

        eventPublisher.publish("activity.chapter-read", new ChapterReadEvent(
                userIdStr, titleId, localeResolver.resolve(title.getName()), title.getCover(), chapterNumber));
        behaviorEventRecorder.record(userId, BehaviorEventType.CHAPTER_COMPLETED,
                titleId, chapterNumber, "READING_PROGRESS");
    }
}
