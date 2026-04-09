package com.mangareader.presentation.admin.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.user.usecase.admin.BanUserUseCase;
import com.mangareader.application.user.usecase.admin.ChangeUserRoleUseCase;
import com.mangareader.application.user.usecase.admin.GetUserDetailsUseCase;
import com.mangareader.application.user.usecase.admin.ListUsersUseCase;
import com.mangareader.application.user.usecase.admin.UnbanUserUseCase;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.presentation.admin.dto.AdminUserResponse;
import com.mangareader.presentation.admin.dto.BanUserRequest;
import com.mangareader.presentation.admin.dto.ChangeRoleRequest;
import com.mangareader.presentation.admin.mapper.AdminUserMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para gestão de usuários.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final ListUsersUseCase listUsersUseCase;
    private final GetUserDetailsUseCase getUserDetailsUseCase;
    private final ChangeUserRoleUseCase changeUserRoleUseCase;
    private final BanUserUseCase banUserUseCase;
    private final UnbanUserUseCase unbanUserUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));

        var result = listUsersUseCase.execute(search, pageable);
        var mapped = result.map(AdminUserMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getUserDetails(@PathVariable UUID id) {
        var user = getUserDetailsUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(AdminUserMapper.toResponse(user)));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> changeRole(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeRoleRequest request,
            Authentication auth
    ) {
        UUID adminId = (UUID) auth.getPrincipal();
        UserRole newRole = UserRole.valueOf(request.role().toUpperCase());

        var user = changeUserRoleUseCase.execute(adminId, id, newRole);

        return ResponseEntity.ok(ApiResponse.success(AdminUserMapper.toResponse(user)));
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<ApiResponse<AdminUserResponse>> banUser(
            @PathVariable UUID id,
            @Valid @RequestBody BanUserRequest request
    ) {
        var user = banUserUseCase.execute(id, request.reason(), request.bannedUntil());

        return ResponseEntity.ok(ApiResponse.success(AdminUserMapper.toResponse(user)));
    }

    @DeleteMapping("/{id}/ban")
    public ResponseEntity<ApiResponse<AdminUserResponse>> unbanUser(@PathVariable UUID id) {
        var user = unbanUserUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(AdminUserMapper.toResponse(user)));
    }
}
