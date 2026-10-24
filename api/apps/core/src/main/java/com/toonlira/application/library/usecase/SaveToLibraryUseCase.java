package com.toonlira.application.library.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.library.port.LibraryRepositoryPort;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.library.entity.SavedManga;
import com.toonlira.domain.library.valueobject.ReadingListType;
import com.toonlira.domain.manga.entity.Title;
import com.toonlira.domain.user.entity.User;
import com.toonlira.shared.application.i18n.LocaleResolutionService;
import com.toonlira.shared.exception.DuplicateResourceException;
import com.toonlira.shared.exception.ResourceNotFoundException;
import com.toonlira.application.analytics.service.BehaviorEventRecorder;
import com.toonlira.domain.analytics.entity.BehaviorEventType;

import lombok.RequiredArgsConstructor;

/**
 * Salva um título na biblioteca do usuário.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SaveToLibraryUseCase {
    private final LibraryRepositoryPort libraryRepository;
    private final UserRepositoryPort userRepository;
    private final TitleRepositoryPort titleRepository;
    private final LocaleResolutionService localeResolutionService;
    private final BehaviorEventRecorder behaviorEventRecorder;

    public record SaveToLibraryInput(UUID userId, String titleId, ReadingListType list) {}

    public SavedManga execute(SaveToLibraryInput input) {
        libraryRepository.findByUserIdAndTitleId(input.userId(), input.titleId())
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("SavedManga", "titleId", input.titleId());
                });

        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        Title title = titleRepository.findById(input.titleId())
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", input.titleId()));

        SavedManga saved = SavedManga.builder()
                .user(user)
                .titleId(input.titleId())
                .name(localeResolutionService.resolve(title.getName()))
                .cover(title.getCover())
                .type(title.getType())
                .adult(title.isAdult())
                .list(input.list())
                .build();

        SavedManga result = libraryRepository.save(saved);
        behaviorEventRecorder.record(input.userId(), BehaviorEventType.LIBRARY_ITEM_ADDED,
                input.titleId(), null, input.list().name());
        return result;
    }
}
