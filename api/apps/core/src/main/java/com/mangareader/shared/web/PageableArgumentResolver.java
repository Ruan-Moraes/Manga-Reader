package com.mangareader.shared.web;

import java.util.Set;

import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Resolve parâmetros {@link Pageable} a partir dos query params
 * {@code page}/{@code size}/{@code sort}/{@code direction}, preservando o
 * contrato de API atual (params separados, não o {@code sort=campo,dir} do
 * resolver padrão do Spring Data).
 *
 * <p>Defaults e whitelist via {@link PageParams}. Centraliza a lógica antes
 * duplicada em {@code buildPageable(...)} de 10 controllers.
 */
public class PageableArgumentResolver implements HandlerMethodArgumentResolver {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return Pageable.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(
            @NonNull MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            @NonNull NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory) {

        PageParams cfg = parameter.getParameterAnnotation(PageParams.class);
        String defaultSort = cfg != null ? cfg.defaultSort() : "id";
        String defaultDirection = cfg != null ? cfg.defaultDirection() : "desc";
        int defaultSize = cfg != null ? cfg.defaultSize() : DEFAULT_SIZE;
        boolean ignoreRequestSort = cfg != null && cfg.ignoreRequestSort();

        int page = parseInt(webRequest.getParameter("page"), DEFAULT_PAGE);
        int size = parseInt(webRequest.getParameter("size"), defaultSize);

        String sortField = defaultSort;
        String direction = defaultDirection;
        if (!ignoreRequestSort) {
            String reqSort = webRequest.getParameter("sort");
            if (reqSort != null && !reqSort.isBlank()) {
                sortField = reqSort;
            }
            String reqDir = webRequest.getParameter("direction");
            if (reqDir != null && !reqDir.isBlank()) {
                direction = reqDir;
            }
        }

        if (cfg != null && cfg.allow().length > 0) {
            SortValidator.validate(sortField, Set.of(cfg.allow()));
        }

        Sort.Direction dir = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(dir, sortField));
    }

    private static int parseInt(String value, int fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
