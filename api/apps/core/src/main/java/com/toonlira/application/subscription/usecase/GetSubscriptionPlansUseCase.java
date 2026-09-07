package com.toonlira.application.subscription.usecase;

import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.toonlira.domain.subscription.entity.SubscriptionPlan;
import com.toonlira.shared.constant.CacheNames;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todos os planos de assinatura ativos.
 * Resultado cacheado para reduzir consultas ao banco.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetSubscriptionPlansUseCase {
    private final SubscriptionPlanRepositoryPort planRepository;

    @Cacheable(CacheNames.SUBSCRIPTION_PLANS)
    public List<SubscriptionPlan> execute() {
        return planRepository.findAllActive();
    }
}
