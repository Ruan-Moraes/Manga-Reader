package com.toonlira.application.library.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.library.port.LibraryRepositoryPort;
import com.toonlira.application.shared.event.TitleCompletedEvent;
import com.toonlira.application.shared.port.EventPublisherPort;
import com.toonlira.domain.library.entity.SavedManga;
import com.toonlira.domain.library.valueobject.ReadingListType;
import com.toonlira.shared.exception.ResourceNotFoundException;
import com.toonlira.application.analytics.service.BehaviorEventRecorder;
import com.toonlira.domain.analytics.entity.BehaviorEventType;

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
