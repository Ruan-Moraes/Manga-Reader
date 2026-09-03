package com.mangareader.application.user.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.presentation.admin.dto.DashboardMetricsResponse;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetDashboardMetricsUseCase")
class GetDashboardMetricsUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private TitleRepositoryPort titleRepository;

    @Mock
    private GroupRepositoryPort groupRepository;

    @Mock
    private NewsRepositoryPort newsRepository;

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private GetDashboardMetricsUseCase getDashboardMetricsUseCase;

    @Test
    @DisplayName("Deve agregar métricas de todos os domínios")
    void deveAgregarMetricas() {
        when(userRepository.count()).thenReturn(150L);
        when(titleRepository.count()).thenReturn(500L);
        when(groupRepository.count()).thenReturn(25L);
        when(newsRepository.count()).thenReturn(80L);
        when(eventRepository.count()).thenReturn(10L);
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(2L);
        when(userRepository.countByRole(UserRole.MODERATOR)).thenReturn(8L);
        when(userRepository.countByRole(UserRole.MEMBER)).thenReturn(140L);
        when(userRepository.countByBannedTrue()).thenReturn(5L);

        DashboardMetricsResponse result = getDashboardMetricsUseCase.execute();

        assertThat(result.totalUsers()).isEqualTo(150L);
        assertThat(result.totalTitles()).isEqualTo(500L);
        assertThat(result.totalGroups()).isEqualTo(25L);
        assertThat(result.totalNews()).isEqualTo(80L);
        assertThat(result.totalEvents()).isEqualTo(10L);
        assertThat(result.usersByRole()).containsEntry("ADMIN", 2L);
        assertThat(result.usersByRole()).containsEntry("MODERATOR", 8L);
        assertThat(result.usersByRole()).containsEntry("MEMBER", 140L);
        assertThat(result.bannedUsers()).isEqualTo(5L);
    }

    @Test
    @DisplayName("Deve retornar zeros quando não há dados")
    void deveRetornarZeros() {
        when(userRepository.count()).thenReturn(0L);
        when(titleRepository.count()).thenReturn(0L);
        when(groupRepository.count()).thenReturn(0L);
        when(newsRepository.count()).thenReturn(0L);
        when(eventRepository.count()).thenReturn(0L);
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(0L);
        when(userRepository.countByRole(UserRole.MODERATOR)).thenReturn(0L);
        when(userRepository.countByRole(UserRole.MEMBER)).thenReturn(0L);
        when(userRepository.countByBannedTrue()).thenReturn(0L);

        DashboardMetricsResponse result = getDashboardMetricsUseCase.execute();

        assertThat(result.totalUsers()).isZero();
        assertThat(result.totalTitles()).isZero();
        assertThat(result.bannedUsers()).isZero();
    }
}
