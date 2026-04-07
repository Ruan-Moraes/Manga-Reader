package com.mangareader.shared.dto;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * Wrapper de paginação para respostas paginadas.
 * <p>
 * Converte um {@link Page} do Spring Data em uma estrutura simples, amigável
 * para o frontend consumir sem acoplamento com classes do Spring.
 *
 * @param <T> tipo dos elementos paginados
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
