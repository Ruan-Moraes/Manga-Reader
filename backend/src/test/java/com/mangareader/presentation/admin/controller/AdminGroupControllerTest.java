package com.mangareader.presentation.admin.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.group.usecase.admin.AdminChangeGroupMemberRoleUseCase;
import com.mangareader.application.group.usecase.admin.AdminGetGroupDetailsUseCase;
import com.mangareader.application.group.usecase.admin.AdminListGroupsUseCase;
import com.mangareader.application.group.usecase.admin.AdminRemoveGroupMemberUseCase;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.domain.user.entity.User;

@WebMvcTest(AdminGroupController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminGroupController")
class AdminGroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private AdminListGroupsUseCase listGroupsUseCase;

    @MockitoBean
    private AdminGetGroupDetailsUseCase getGroupDetailsUseCase;

    @MockitoBean
    private AdminChangeGroupMemberRoleUseCase changeGroupMemberRoleUseCase;

    @MockitoBean
    private AdminRemoveGroupMemberUseCase removeGroupMemberUseCase;

    private final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    private Group buildGroup() {
        return Group.builder()
                .id(GROUP_ID)
                .name("Scan Group")
                .username("scangroup")
                .logo("logo.png")
                .description("A scan group")
                .status(GroupStatus.ACTIVE)
                .totalTitles(5)
                .rating(4.5)
                .popularity(100)
                .platformJoinedAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .groupUsers(new ArrayList<>())
                .build();
    }

    private Group buildGroupWithMember() {
        Group group = buildGroup();
        User user = User.builder().id(USER_ID).name("Member").email("member@test.com").build();
        GroupUser gu = GroupUser.builder()
                .user(user)
                .type(GroupUserType.MEMBER)
                .role(GroupRole.TRADUTOR)
                .joinedAt(LocalDateTime.of(2026, 2, 1, 0, 0))
                .build();
        group.getGroupUsers().add(gu);
        return group;
    }

    @Test
    @DisplayName("GET /api/admin/groups — deve retornar 200 com lista paginada")
    void deveRetornar200ComListaPaginada() throws Exception {
        var page = new PageImpl<>(List.of(buildGroup()));
        when(listGroupsUseCase.execute(any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/admin/groups"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Scan Group"));
    }

    @Test
    @DisplayName("GET /api/admin/groups/{id} — deve retornar 200 com detalhes e membros")
    void deveRetornar200ComDetalhesEMembros() throws Exception {
        when(getGroupDetailsUseCase.execute(GROUP_ID)).thenReturn(buildGroupWithMember());

        mockMvc.perform(get("/api/admin/groups/" + GROUP_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Scan Group"))
                .andExpect(jsonPath("$.data.members[0].userName").value("Member"))
                .andExpect(jsonPath("$.data.members[0].role").value("TRADUTOR"));
    }

    @Test
    @DisplayName("PATCH /api/admin/groups/{groupId}/members/{userId}/role — deve retornar 200")
    void deveRetornar200AoAlterarRole() throws Exception {
        Group group = buildGroupWithMember();
        group.getGroupUsers().getFirst().setRole(GroupRole.LIDER);
        when(changeGroupMemberRoleUseCase.execute(eq(GROUP_ID), eq(USER_ID), eq(GroupRole.LIDER)))
                .thenReturn(group);

        mockMvc.perform(patch("/api/admin/groups/" + GROUP_ID + "/members/" + USER_ID + "/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role": "LIDER"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.members[0].role").value("LIDER"));
    }

    @Test
    @DisplayName("DELETE /api/admin/groups/{groupId}/members/{userId} — deve retornar 200")
    void deveRetornar200AoRemoverMembro() throws Exception {
        when(removeGroupMemberUseCase.execute(GROUP_ID, USER_ID)).thenReturn(buildGroup());

        mockMvc.perform(delete("/api/admin/groups/" + GROUP_ID + "/members/" + USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.members").isEmpty());
    }
}
