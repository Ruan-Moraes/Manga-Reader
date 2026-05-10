package com.mangareader.application.forum.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

import lombok.RequiredArgsConstructor;

/**
 * Retorna tópicos do fórum com paginação, particionados pelo idioma do
 * usuário (UGC i18n — Etapa 3).
 */
@Service
@RequiredArgsConstructor
public class GetForumTopicsUseCase {
    private final ForumRepositoryPort forumRepository;
    private final LocaleResolutionService localeResolver;

    @Transactional(readOnly = true)
    public Page<ForumTopic> execute(Pageable pageable) {
        return execute(pageable, false);
    }

    /**
     * @param crossLanguage quando {@code true}, retorna tópicos de todos os idiomas
     *                      (uso admin/moderação). Quando {@code false}, particiona
     *                      pelo idioma do usuário ativo.
     */
    @Transactional(readOnly = true)
    public Page<ForumTopic> execute(Pageable pageable, boolean crossLanguage) {
        Page<ForumTopic> page = crossLanguage
                ? forumRepository.findAll(pageable)
                : forumRepository.findByLanguage(localeResolver.currentLanguageTag(), pageable);

        page.getContent().forEach(topic -> {
            topic.getAuthor().getName();
            topic.getReplies().forEach(r -> r.getAuthor().getName());
        });

        return page;
    }
}
