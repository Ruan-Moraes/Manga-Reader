package com.mangareader.application.subscription.usecase.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;

import lombok.RequiredArgsConstructor;

/**
 * Lista todos os planos de assinatura (incluindo inativos) para o painel admin.
 */
@Service
@RequiredArgsConstructor
public class ListSubscriptionPlansAdminUseCase {

    private final SubscriptionPlanRepositoryPort planRepository;

    @Transactional(readOnly = true)
    public Page<SubscriptionPlan> execute(Pageable pageable) {
        return planRepository.findAll(pageable);
    }
}
