package com.mangareader.application.subscription.usecase;

import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.shared.constant.CacheNames;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todos os planos de assinatura ativos.
 * Resultado cacheado para reduzir consultas ao banco.
 */
@Service
@RequiredArgsConstructor
public class GetSubscriptionPlansUseCase {

    private final SubscriptionPlanRepositoryPort planRepository;

    @Cacheable(CacheNames.SUBSCRIPTION_PLANS)
    public List<SubscriptionPlan> execute() {
        return planRepository.findAllActive();
    }
}
