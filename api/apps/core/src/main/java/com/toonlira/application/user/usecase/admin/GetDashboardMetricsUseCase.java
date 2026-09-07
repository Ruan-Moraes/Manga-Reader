package com.toonlira.application.user.usecase.admin;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.event.port.EventRepositoryPort;
import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.news.port.NewsRepositoryPort;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.user.valueobject.UserRole;
import com.toonlira.presentation.admin.dto.DashboardMetricsResponse;

import lombok.RequiredArgsConstructor;

/**
 * Agrega métricas de múltiplos domínios para o dashboard admin.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetDashboardMetricsUseCase {
    private final UserRepositoryPort userRepository;
    private final TitleRepositoryPort titleRepository;
    private final GroupRepositoryPort groupRepository;
    private final NewsRepositoryPort newsRepository;
    private final EventRepositoryPort eventRepository;

    public DashboardMetricsResponse execute() {
        Map<String, Long> usersByRole = new LinkedHashMap<>();

        for (UserRole role : UserRole.values()) {
            usersByRole.put(role.name(), userRepository.countByRole(role));
        }

        return new DashboardMetricsResponse(
                userRepository.count(),
                titleRepository.count(),
                groupRepository.count(),
                newsRepository.count(),
                eventRepository.count(),
                usersByRole,
                userRepository.countByBannedTrue()
        );
    }
}
