package com.mangareader.infrastructure.persistence.postgres.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(UserRepositoryAdapter.class)
@DisplayName("UserRepositoryAdapter — Integração JPA")
class UserRepositoryAdapterTest {

    @Autowired
    private UserRepositoryPort userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User savedUser;

    @BeforeEach
    void setUp() {
        savedUser = entityManager.persistAndFlush(
                User.builder()
                        .name("Ruan Silva")
                        .email("ruan@email.com")
                        .passwordHash("$2a$10$hashexample")
                        .role(UserRole.MEMBER)
                        .build()
        );
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar o usuário quando ID existe")
        void deveRetornarUsuarioQuandoIdExiste() {
            var result = userRepository.findById(savedUser.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Ruan Silva");
            assertThat(result.get().getEmail()).isEqualTo("ruan@email.com");
        }

        @Test
        @DisplayName("Deve retornar empty quando ID não existe")
        void deveRetornarEmptyQuandoIdNaoExiste() {
            var result = userRepository.findById(UUID.randomUUID());

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByEmail")
    class FindByEmail {

        @Test
        @DisplayName("Deve encontrar usuário por email")
        void deveEncontrarUsuarioPorEmail() {
            var result = userRepository.findByEmail("ruan@email.com");

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Ruan Silva");
        }

        @Test
        @DisplayName("Deve retornar empty para email inexistente")
        void deveRetornarEmptyParaEmailInexistente() {
            var result = userRepository.findByEmail("inexistente@email.com");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("existsByEmail")
    class ExistsByEmail {

        @Test
        @DisplayName("Deve retornar true quando email existe")
        void deveRetornarTrueQuandoEmailExiste() {
            assertThat(userRepository.existsByEmail("ruan@email.com")).isTrue();
        }

        @Test
        @DisplayName("Deve retornar false quando email não existe")
        void deveRetornarFalseQuandoEmailNaoExiste() {
            assertThat(userRepository.existsByEmail("naoexiste@email.com")).isFalse();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo usuário e gerar UUID")
        void devePersistirNovoUsuario() {
            var newUser = User.builder()
                    .name("Maria Silva")
                    .email("maria@email.com")
                    .passwordHash("hash123")
                    .build();

            var persisted = userRepository.save(newUser);

            assertThat(persisted.getId()).isNotNull();
            assertThat(persisted.getName()).isEqualTo("Maria Silva");
            assertThat(persisted.getRole()).isEqualTo(UserRole.MEMBER);
        }

        @Test
        @DisplayName("Deve atualizar usuário existente")
        void deveAtualizarUsuarioExistente() {
            savedUser.setName("Ruan Moraes");
            userRepository.save(savedUser);

            entityManager.flush();
            entityManager.clear();

            var updated = userRepository.findById(savedUser.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getName()).isEqualTo("Ruan Moraes");
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover o usuário")
        void deveRemoverUsuario() {
            userRepository.deleteById(savedUser.getId());
            entityManager.flush();

            assertThat(userRepository.findById(savedUser.getId())).isEmpty();
        }
    }
}
