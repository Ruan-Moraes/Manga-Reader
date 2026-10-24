package com.toonlira.application.analytics.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.analytics.port.BehaviorEventRepositoryPort;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClearBehaviorHistoryUseCase {
    private final BehaviorEventRepositoryPort repository;

    @Transactional("mongoTransactionManager")
    public void execute(String userId) {
        repository.deleteAllByUserId(userId);
    }
}
