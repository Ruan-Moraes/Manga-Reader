package com.mangareader.application.library.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.shared.event.TitleCompletedEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.analytics.service.BehaviorEventRecorder;
import com.mangareader.domain.analytics.entity.BehaviorEventType;

import lombok.RequiredArgsConstructor;

/**
 * Altera a lista de leitura de um mangá salvo (ex: "Lendo" → "Concluído").
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ChangeReadingListUseCase {
    private final LibraryRepositoryPort libraryRepository;
    private final EventPublisherPort eventPublisher;
    private final BehaviorEventRecorder behaviorEventRecorder;

    public record ChangeListInput(UUID userId, String titleId, ReadingListType newList) {}

    public SavedManga execute(ChangeListInput input) {
        SavedManga saved = libraryRepository.findByUserIdAndTitleId(input.userId(), input.titleId())
                .orElseThrow(() -> new ResourceNotFoundException("SavedManga", "titleId", input.titleId()));

        ReadingListType previousList = saved.getList();

        saved.setList(input.newList());

        SavedManga updated = libraryRepository.save(saved);
        behaviorEventRecorder.record(input.userId(), BehaviorEventType.LIBRARY_LIST_CHANGED,
                input.titleId(), null, previousList.name() + "_TO_" + input.newList().name());

        if (input.newList() == ReadingListType.CONCLUIDO && previousList != ReadingListType.CONCLUIDO) {
            eventPublisher.publish("activity.title-completed", new TitleCompletedEvent(
                    input.userId().toString(), input.titleId(), updated.getName(), updated.getCover()));
        }

        return updated;
    }
}
