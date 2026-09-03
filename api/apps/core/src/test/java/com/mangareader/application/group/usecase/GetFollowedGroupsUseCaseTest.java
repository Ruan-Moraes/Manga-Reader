package com.mangareader.application.group.usecase;

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
@DisplayName("GetFollowedGroupsUseCase")
class GetFollowedGroupsUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private GetFollowedGroupsUseCase useCase;

    private Group group(UUID id, String username) {
        return Group.builder().id(id).name(LocalizedString.ofDefault("Scan " + username)).username(username).build();
    }

    @Test
    @DisplayName("Deve incluir grupos onde o usuário é membro, mesmo sem vínculo de apoiador")
    void deveIncluirGruposOndeEhMembro() {
        UUID userId = UUID.randomUUID();
        Group memberGroup = group(UUID.randomUUID(), "scan-membro");

        when(groupRepository.findGroupsByMemberUserId(userId)).thenReturn(List.of(memberGroup));
        when(groupRepository.findGroupsBySupporterUserId(userId)).thenReturn(List.of());

        var result = useCase.execute(userId);

        assertThat(result).containsExactly(memberGroup);
    }

    @Test
    @DisplayName("Deve unir grupos de membro e de apoiador sem duplicar")
    void deveUnirMembroEApoiadorSemDuplicar() {
        UUID userId = UUID.randomUUID();
        Group memberGroup = group(UUID.randomUUID(), "scan-membro");
        Group supporterGroup = group(UUID.randomUUID(), "scan-apoiado");

        when(groupRepository.findGroupsByMemberUserId(userId)).thenReturn(List.of(memberGroup));
        when(groupRepository.findGroupsBySupporterUserId(userId)).thenReturn(List.of(supporterGroup, memberGroup));

        var result = useCase.execute(userId);

        assertThat(result).containsExactlyInAnyOrder(memberGroup, supporterGroup);
    }

    @Test
    @DisplayName("Deve retornar lista vazia quando não há vínculos")
    void deveRetornarVazio() {
        UUID userId = UUID.randomUUID();

        when(groupRepository.findGroupsByMemberUserId(userId)).thenReturn(List.of());
        when(groupRepository.findGroupsBySupporterUserId(userId)).thenReturn(List.of());

        var result = useCase.execute(userId);

        assertThat(result).isEmpty();
    }
}
