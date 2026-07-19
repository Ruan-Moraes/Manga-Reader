package com.mangareader.application.library.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.manga.service.AdultContentAccessPolicy;
import com.mangareader.domain.library.entity.SavedManga;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LibraryAdultContentService {
    private final TitleRepositoryPort titles;
    private final AdultContentAccessPolicy policy;

    public Page<SavedManga> enrichPage(Page<SavedManga> page) {
        enrich(page.getContent());
        return page;
    }

    public Page<SavedManga> filterAndPageForViewer(List<SavedManga> all, UUID viewerId, Pageable pageable) {
        enrich(all);
        List<SavedManga> visible = policy.mustExcludeAdult(viewerId)
                ? all.stream().filter(saved -> !saved.isAdult()).toList()
                : all;
        int start = Math.min((int) pageable.getOffset(), visible.size());
        int end = Math.min(start + pageable.getPageSize(), visible.size());
        return new PageImpl<>(visible.subList(start, end), pageable, visible.size());
    }

    public boolean mustFilter(UUID viewerId) {
        return policy.mustExcludeAdult(viewerId);
    }

    private void enrich(List<SavedManga> entries) {
        Map<String, Boolean> adultById = titles.findByIds(entries.stream().map(SavedManga::getTitleId).toList())
                .stream().collect(Collectors.toMap(com.mangareader.domain.manga.entity.Title::getId,
                        com.mangareader.domain.manga.entity.Title::isAdult, (left, right) -> left));
        entries.forEach(entry -> entry.setAdult(adultById.getOrDefault(entry.getTitleId(), false)));
    }
}
