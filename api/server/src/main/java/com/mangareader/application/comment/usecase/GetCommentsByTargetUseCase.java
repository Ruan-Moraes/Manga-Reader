package com.mangareader.application.comment.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.shared.application.i18n.LocaleResolutionService;

import lombok.RequiredArgsConstructor;

/**
 * Retorna os comentários de um alvo (obra/título, resenha ou tópico de fórum),
 * raiz + respostas, particionados pelo idioma de exibição (UGC i18n).
 */
@Service
@RequiredArgsConstructor
public class GetCommentsByTargetUseCase {
    private final CommentRepositoryPort commentRepository;
    private final LocaleResolutionService localeResolver;

    public Page<Comment> execute(CommentTarget targetType, String targetId, Pageable pageable) {
        return execute(targetType, targetId, pageable, false);
    }

    /**
     * @param crossLanguage {@code true} bypassa partição UGC (admin moderação).
     */
    public Page<Comment> execute(CommentTarget targetType, String targetId, Pageable pageable, boolean crossLanguage) {
        return crossLanguage
                ? commentRepository.findByTargetTypeAndTargetId(targetType, targetId, pageable)
                : commentRepository.findByTargetTypeAndTargetIdAndLanguageIn(
                        targetType, targetId, localeResolver.currentContentLanguageTags(), pageable);
    }
}
