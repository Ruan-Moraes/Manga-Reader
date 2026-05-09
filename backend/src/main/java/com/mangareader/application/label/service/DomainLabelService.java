package com.mangareader.application.label.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.label.port.DomainLabelRepositoryPort;
import com.mangareader.domain.label.entity.DomainLabel;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;

import lombok.RequiredArgsConstructor;

/**
 * Serviço de resolução de labels de domínio por locale.
 * <p>
 * Injetado em mappers (ex.: {@code NewsMapper}, {@code EventMapper}) para
 * converter valores de enum em labels já traduzidos conforme o
 * {@code Accept-Language} do request.
 */
@Service
@RequiredArgsConstructor
public class DomainLabelService {

    private final DomainLabelRepositoryPort repository;
    private final LocalizedMappingHelper i18n;

    public List<DomainLabel> findAllByType(String type) {
        return repository.findAllByType(type);
    }

    /**
     * Resolve o label traduzido para o locale ativo.
     * Retorna {@code fallback} se não encontrar entrada no banco.
     */
    public String resolveLabel(String type, String value, String fallback) {
        return repository.findByTypeAndValue(type, value)
                .map(label -> i18n.resolveOrFallback(label.getLabelI18n(), fallback))
                .orElse(fallback);
    }

    public String resolveLabel(String type, String value) {
        return resolveLabel(type, value, value);
    }
}
