package com.toonlira.application.publisher.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import com.toonlira.application.publisher.port.PublisherRepositoryPort;
import com.toonlira.application.publisher.port.TitlePublisherRepositoryPort;
import com.toonlira.application.search.RelatedTitleResult;
import com.toonlira.shared.application.i18n.LocaleResolutionService;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetPublisherWorksUseCase {
    private final PublisherRepositoryPort publisherRepository;
    private final TitlePublisherRepositoryPort titlePublisherRepository;
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultContentAccessPolicy;
    private final LocaleResolutionService localeResolutionService;

    @Transactional(readOnly = true)
    public Page<RelatedTitleResult> execute(
            Long publisherId, Pageable pageable, UUID userId) {
        publisherRepository.findById(publisherId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Publisher", "id", publisherId));
        var titleIds = titlePublisherRepository.findTitleIdsByPublisherId(publisherId);

        return titleRepository.findVisibleByIds(
                        titleIds,
                        adultContentAccessPolicy.mustExcludeAdult(userId),
                        pageable)
                .map(title -> new RelatedTitleResult(
                        title.getId(), localeResolutionService.resolve(title.getName()),
                        title.getCover(), title.getType(), title.getStatus(), title.isAdult(),
                        List.of()));
    }
}
