package com.toonlira.application.analytics.port;

import java.util.List;

import com.toonlira.domain.analytics.entity.BehaviorEvent;

public interface BehaviorEventRepositoryPort {
    void insertIgnoringDuplicates(List<BehaviorEvent> events);

    void deleteAllByUserId(String userId);

    List<BehaviorEvent> findAllByUserId(String userId);
}
