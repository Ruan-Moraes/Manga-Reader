package com.mangareader.application.user.usecase.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;

import lombok.RequiredArgsConstructor;

/**
 * Lista usuários com paginação e busca opcional por nome/email.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ListUsersUseCase {
    private final UserRepositoryPort userRepository;

    public Page<User> execute(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return userRepository.searchByNameOrEmail(search.trim(), pageable);
        }

        return userRepository.findAll(pageable);
    }
}
