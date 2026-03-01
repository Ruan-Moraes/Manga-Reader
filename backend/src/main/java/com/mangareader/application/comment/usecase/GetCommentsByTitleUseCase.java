package com.mangareader.application.comment.usecase;

import java.util.List;

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
    public List<Comment> execute(String titleId) {
        return commentRepository.findByTitleId(titleId);
    }
}
