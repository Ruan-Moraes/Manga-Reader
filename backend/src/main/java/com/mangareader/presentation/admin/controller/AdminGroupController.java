package com.mangareader.presentation.admin.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.group.usecase.admin.AdminChangeGroupMemberRoleUseCase;
import com.mangareader.application.group.usecase.admin.AdminGetGroupDetailsUseCase;
import com.mangareader.application.group.usecase.admin.AdminListGroupsUseCase;
import com.mangareader.application.group.usecase.admin.AdminRemoveGroupMemberUseCase;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.presentation.admin.dto.AdminGroupResponse;
import com.mangareader.presentation.admin.dto.ChangeGroupMemberRoleRequest;
import com.mangareader.presentation.admin.mapper.AdminGroupMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para gestão de grupos.
 */
@RestController
@RequestMapping("/api/admin/groups")
@RequiredArgsConstructor
public class AdminGroupController {

    private final AdminListGroupsUseCase listGroupsUseCase;
    private final AdminGetGroupDetailsUseCase getGroupDetailsUseCase;
    private final AdminChangeGroupMemberRoleUseCase changeGroupMemberRoleUseCase;
    private final AdminRemoveGroupMemberUseCase removeGroupMemberUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminGroupResponse>>> listGroups(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "platformJoinedAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));

        var result = listGroupsUseCase.execute(search, pageable);
        var mapped = result.map(AdminGroupMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminGroupResponse>> getGroupDetails(@PathVariable UUID id) {
        var group = getGroupDetailsUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(AdminGroupMapper.toDetailResponse(group)));
    }

    @PatchMapping("/{groupId}/members/{userId}/role")
    public ResponseEntity<ApiResponse<AdminGroupResponse>> changeGroupMemberRole(
            @PathVariable UUID groupId,
            @PathVariable UUID userId,
            @Valid @RequestBody ChangeGroupMemberRoleRequest request
    ) {
        GroupRole newRole = GroupRole.valueOf(request.role().toUpperCase());
        var group = changeGroupMemberRoleUseCase.execute(groupId, userId, newRole);

        return ResponseEntity.ok(ApiResponse.success(AdminGroupMapper.toDetailResponse(group)));
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<ApiResponse<AdminGroupResponse>> removeGroupMember(
            @PathVariable UUID groupId,
            @PathVariable UUID userId
    ) {
        var group = removeGroupMemberUseCase.execute(groupId, userId);

        return ResponseEntity.ok(ApiResponse.success(AdminGroupMapper.toDetailResponse(group)));
    }
}
