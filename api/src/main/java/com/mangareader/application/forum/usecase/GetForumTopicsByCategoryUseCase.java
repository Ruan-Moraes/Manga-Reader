package com.mangareader.application.forum.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

import lombok.RequiredArgsConstructor;

/**
 * Filtra tópicos do fórum por categoria com paginação, particionado por idioma.
 */
@Service
@RequiredArgsConstructor
public class GetForumTopicsByCategoryUseCase {
    private final ForumRepositoryPort forumRepository;
    private final LocaleResolutionService localeResolver;

    @Transactional(readOnly = true)
    public Page<ForumTopic> execute(ForumCategory category, Pageable pageable) {
        return execute(category, pageable, false);
    }

    @Transactional(readOnly = true)
    public Page<ForumTopic> execute(ForumCategory category, Pageable pageable, boolean crossLanguage) {
        // author via @EntityGraph; replies não carregadas na listagem.
        return crossLanguage
                ? forumRepository.findByCategory(category, pageable)
                : forumRepository.findByCategoryAndLanguageIn(
                        category, localeResolver.currentContentLanguageTags(), pageable);
    }
}
