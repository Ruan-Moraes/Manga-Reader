package com.mangareader.application.analytics.port;

import java.util.List;

import com.mangareader.domain.analytics.entity.BehaviorEvent;

public interface BehaviorEventRepositoryPort {
    void insertIgnoringDuplicates(List<BehaviorEvent> events);
    void deleteAllByUserId(String userId);
    List<BehaviorEvent> findAllByUserId(String userId);
}
