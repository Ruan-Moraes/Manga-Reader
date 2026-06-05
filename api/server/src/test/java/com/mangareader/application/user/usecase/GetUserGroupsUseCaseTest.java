package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.shared.domain.i18n.LocalizedString;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserGroupsUseCase")
class GetUserGroupsUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private GetUserGroupsUseCase useCase;

    private Group group(String username) {
        return Group.builder()
                .id(UUID.randomUUID())
                .name(LocalizedString.ofDefault("Scan " + username))
                .username(username)
                .build();
    }

    @Test
    @DisplayName("Deve separar grupos vinculados dos disponíveis")
    void deveSepararVinculadosDeDisponiveis() {
        UUID userId = UUID.randomUUID();
        Group linked = group("scan-op");
        Group available = group("scan-naruto");

        when(groupRepository.findGroupsByMemberUserId(userId)).thenReturn(List.of(linked));
        when(groupRepository.findAvailableGroupsForUser(userId)).thenReturn(List.of(available));

        var result = useCase.execute(userId);

        assertThat(result.linked()).containsExactly(linked);
        assertThat(result.available()).containsExactly(available);
    }

    @Test
    @DisplayName("Deve retornar listas vazias quando usuário não tem vínculos e não há grupos")
    void deveRetornarVazio() {
        UUID userId = UUID.randomUUID();

        when(groupRepository.findGroupsByMemberUserId(userId)).thenReturn(List.of());
        when(groupRepository.findAvailableGroupsForUser(userId)).thenReturn(List.of());

        var result = useCase.execute(userId);

        assertThat(result.linked()).isEmpty();
        assertThat(result.available()).isEmpty();
    }
}
