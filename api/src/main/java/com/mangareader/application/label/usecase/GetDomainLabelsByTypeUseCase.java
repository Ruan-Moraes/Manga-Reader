package com.mangareader.application.label.usecase;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.label.port.DomainLabelRepositoryPort;
import com.mangareader.domain.label.entity.DomainLabel;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todos os labels de domínio de um determinado tipo.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetDomainLabelsByTypeUseCase {

    private final DomainLabelRepositoryPort repository;

    public List<DomainLabel> execute(String type) {
        return repository.findAllByType(type);
    }
}
