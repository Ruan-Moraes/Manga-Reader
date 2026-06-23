package com.mangareader.application.user.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;

@ExtendWith(MockitoExtension.class)
@DisplayName("ListUsersUseCase")
class ListUsersUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private ListUsersUseCase listUsersUseCase;

    private final Pageable PAGEABLE = PageRequest.of(0, 20);

    private User buildUser(String name) {
        return User.builder()
                .name(name)
                .email(name.toLowerCase().replace(" ", "") + "@test.com")
                .passwordHash("hash")
                .build();
    }

    @Test
    @DisplayName("Deve listar todos os usuários quando search é null")
    void deveListarTodosQuandoSearchNull() {
        Page<User> page = new PageImpl<>(List.of(buildUser("User One")));
        when(userRepository.findAll(PAGEABLE)).thenReturn(page);

        Page<User> result = listUsersUseCase.execute(null, PAGEABLE);

        assertThat(result.getContent()).hasSize(1);
        verify(userRepository).findAll(PAGEABLE);
    }

    @Test
    @DisplayName("Deve listar todos os usuários quando search é vazio")
    void deveListarTodosQuandoSearchVazio() {
        Page<User> page = new PageImpl<>(List.of(buildUser("User One")));
        when(userRepository.findAll(PAGEABLE)).thenReturn(page);

        Page<User> result = listUsersUseCase.execute("   ", PAGEABLE);

        assertThat(result.getContent()).hasSize(1);
        verify(userRepository).findAll(PAGEABLE);
    }

    @Test
    @DisplayName("Deve buscar por nome ou email quando search tem valor")
    void deveBuscarQuandoSearchTemValor() {
        Page<User> page = new PageImpl<>(List.of(buildUser("Ruan")));
        when(userRepository.searchByNameOrEmail(eq("Ruan"), any(Pageable.class))).thenReturn(page);

        Page<User> result = listUsersUseCase.execute("Ruan", PAGEABLE);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().getName()).isEqualTo("Ruan");
        verify(userRepository).searchByNameOrEmail("Ruan", PAGEABLE);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando nenhum resultado")
    void deveRetornarPaginaVazia() {
        when(userRepository.findAll(PAGEABLE)).thenReturn(Page.empty());

        Page<User> result = listUsersUseCase.execute(null, PAGEABLE);

        assertThat(result.getContent()).isEmpty();
    }
}
