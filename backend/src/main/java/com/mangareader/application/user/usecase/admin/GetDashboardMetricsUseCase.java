package com.mangareader.application.user.usecase.admin;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.presentation.admin.dto.DashboardMetricsResponse;

import lombok.RequiredArgsConstructor;

/**
 * Agrega métricas de múltiplos domínios para o dashboard admin.
 */
@Service
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
