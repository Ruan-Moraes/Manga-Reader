package com.mangareader.application.comment.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;

import lombok.RequiredArgsConstructor;

/**
 * Retorna os comentários de um título (raiz + respostas).
 */
@Service
@RequiredArgsConstructor
public class GetCommentsByTitleUseCase {
    private final CommentRepositoryPort commentRepository;

    /**
     * Retorna todos os comentários do título, ordenados por data (mais recente primeiro).
     */
    public Page<Comment> execute(String titleId, Pageable pageable) {
        return commentRepository.findByTitleId(titleId, pageable);
    }
}
