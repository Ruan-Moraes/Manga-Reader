package com.mangareader.application.library.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.analytics.service.BehaviorEventRecorder;
import com.mangareader.domain.analytics.entity.BehaviorEventType;

import lombok.RequiredArgsConstructor;

/**
 * Remove um título da biblioteca do usuário.
 */
@Service
@RequiredArgsConstructor
public class RemoveFromLibraryUseCase {
    private final LibraryRepositoryPort libraryRepository;
    private final BehaviorEventRecorder behaviorEventRecorder;

    @Transactional
    public void execute(UUID userId, String titleId) {
        libraryRepository.deleteByUserIdAndTitleId(userId, titleId);
        behaviorEventRecorder.record(userId, BehaviorEventType.LIBRARY_ITEM_REMOVED, titleId, null, "LIBRARY");
    }
}
