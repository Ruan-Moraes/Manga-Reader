package com.mangareader.application.comment.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

import lombok.RequiredArgsConstructor;

/**
 * Retorna os comentários de um título (raiz + respostas) particionados pelo
 * idioma de exibição do usuário (UGC i18n — Etapa 3).
 */
@Service
@RequiredArgsConstructor
public class GetCommentsByTitleUseCase {
    private final CommentRepositoryPort commentRepository;
    private final LocaleResolutionService localeResolver;

    public Page<Comment> execute(String titleId, Pageable pageable) {
        return execute(titleId, pageable, false);
    }

    /**
     * @param crossLanguage {@code true} bypassa partição UGC (admin moderação).
     */
    public Page<Comment> execute(String titleId, Pageable pageable, boolean crossLanguage) {
        return crossLanguage
                ? commentRepository.findByTitleId(titleId, pageable)
                : commentRepository.findByTitleIdAndLanguage(
                        titleId, localeResolver.currentLanguageTag(), pageable);
    }
}
