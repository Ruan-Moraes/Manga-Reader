package com.toonlira.application.group.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import com.toonlira.application.search.RelatedTitleResult;
import com.toonlira.shared.application.i18n.LocaleResolutionService;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetGroupWorksUseCase {
    private final GroupRepositoryPort groupRepository;
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultContentAccessPolicy;
    private final LocaleResolutionService localeResolutionService;

    @Transactional(readOnly = true)
    public Page<RelatedTitleResult> execute(
            UUID groupId, Pageable pageable, UUID userId) {
        groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));
        var titleIds = groupRepository.findWorkTitleIdsByGroupIds(List.of(groupId)).stream()
                .map(reference -> reference.titleId())
                .distinct()
                .toList();

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
