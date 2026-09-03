package com.mangareader.application.forum.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

import lombok.RequiredArgsConstructor;

/**
 * Retorna tópicos do fórum com paginação, particionados pelo idioma do
 * usuário (UGC i18n). Listagem usa só o escalar {@code replyCount} — as
 * respostas (comments) vêm apenas no detalhe.
 */
@Service
@RequiredArgsConstructor
public class GetForumTopicsUseCase {
    private final ForumRepositoryPort forumRepository;
    private final LocaleResolutionService localeResolver;

    public Page<ForumTopic> execute(Pageable pageable) {
        return execute(pageable, false);
    }

    /**
     * @param crossLanguage quando {@code true}, retorna tópicos de todos os idiomas
     *                      (uso admin/moderação).
     */
    public Page<ForumTopic> execute(Pageable pageable, boolean crossLanguage) {
        return crossLanguage
                ? forumRepository.findAll(pageable)
                : forumRepository.findByLanguageIn(localeResolver.currentContentLanguageTags(), pageable);
    }
}
