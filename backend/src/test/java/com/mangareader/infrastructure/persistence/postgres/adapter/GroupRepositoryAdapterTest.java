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
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupMember;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.user.entity.User;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(GroupRepositoryAdapter.class)
@DisplayName("GroupRepositoryAdapter — Integração JPA")
class GroupRepositoryAdapterTest {

    @Autowired
    private GroupRepositoryPort groupRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User leader;
    private Group groupA;
    private Group groupB;

    @BeforeEach
    void setUp() {
        leader = entityManager.persistAndFlush(
                User.builder()
                        .name("Líder")
                        .email("lider@email.com")
                        .passwordHash("hash")
                        .build()
        );

        groupA = Group.builder()
                .name("Scan One Piece")
                .username("scan-op")
                .build();
        groupA = entityManager.persistAndFlush(groupA);

        // Adicionar membro ao grupo A
        var member = GroupMember.builder()
                .group(groupA)
                .user(leader)
                .role(GroupRole.LIDER)
                .build();
        groupA.getMembers().add(member);

        // Adicionar work ao grupo A (cross-DB ref para MongoDB)
        var work = GroupWork.builder()
                .group(groupA)
                .titleId("title-mongo-456")
                .title("One Piece")
                .build();
        groupA.getTranslatedWorks().add(work);
        entityManager.persistAndFlush(groupA);

        groupB = entityManager.persistAndFlush(
                Group.builder()
                        .name("Scan Naruto")
                        .username("scan-naruto")
                        .build()
        );
    }

    @Nested
    @DisplayName("findAll")
    class FindAll {

        @Test
        @DisplayName("Deve retornar todos os grupos")
        void deveRetornarTodosOsGrupos() {
            var groups = groupRepository.findAll();

            assertThat(groups).hasSize(2);
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar grupo pelo ID")
        void deveRetornarGrupoPeloId() {
            var result = groupRepository.findById(groupA.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Scan One Piece");
            assertThat(result.get().getUsername()).isEqualTo("scan-op");
        }

        @Test
        @DisplayName("Deve retornar empty para ID inexistente")
        void deveRetornarEmptyParaIdInexistente() {
            assertThat(groupRepository.findById(UUID.randomUUID())).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByUsername")
    class FindByUsername {

        @Test
        @DisplayName("Deve encontrar grupo pelo username")
        void deveEncontrarPorUsername() {
            var result = groupRepository.findByUsername("scan-op");

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Scan One Piece");
        }

        @Test
        @DisplayName("Deve retornar empty para username inexistente")
        void deveRetornarEmptyParaUsernameInexistente() {
            assertThat(groupRepository.findByUsername("inexistente")).isEmpty();
        }
    }

    @Nested
    @DisplayName("existsByUsername")
    class ExistsByUsername {

        @Test
        @DisplayName("Deve retornar true quando username existe")
        void deveRetornarTrueQuandoExiste() {
            assertThat(groupRepository.existsByUsername("scan-op")).isTrue();
        }

        @Test
        @DisplayName("Deve retornar false quando username não existe")
        void deveRetornarFalseQuandoNaoExiste() {
            assertThat(groupRepository.existsByUsername("nao-existe")).isFalse();
        }
    }

    @Nested
    @DisplayName("findByTitleId")
    class FindByTitleId {

        @Test
        @DisplayName("Deve retornar grupos que traduzem o título")
        void deveRetornarGruposComTitulo() {
            var result = groupRepository.findByTitleId("title-mongo-456");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Scan One Piece");
        }

        @Test
        @DisplayName("Deve retornar vazio quando nenhum grupo traduz o título")
        void deveRetornarVazioQuandoTituloInexistente() {
            var result = groupRepository.findByTitleId("titulo-inexistente");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findAll paginado")
    class FindAllPaginated {

        @Test
        @DisplayName("Deve retornar página com tamanho correto")
        void deveRetornarPaginaCorreta() {
            var page = groupRepository.findAll(PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getTotalPages()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo grupo e gerar UUID")
        void devePersistirNovoGrupo() {
            var newGroup = Group.builder()
                    .name("Scan Bleach")
                    .username("scan-bleach")
                    .build();

            var persisted = groupRepository.save(newGroup);

            assertThat(persisted.getId()).isNotNull();
            assertThat(persisted.getName()).isEqualTo("Scan Bleach");
        }

        @Test
        @DisplayName("Deve atualizar grupo existente")
        void deveAtualizarGrupo() {
            groupB.setName("Scan Naruto Shippuden");
            var updated = groupRepository.save(groupB);
            entityManager.flush();

            assertThat(updated.getName()).isEqualTo("Scan Naruto Shippuden");
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover grupo pelo ID")
        void deveRemoverGrupo() {
            groupRepository.deleteById(groupB.getId());
            entityManager.flush();

            assertThat(groupRepository.findById(groupB.getId())).isEmpty();
        }
    }
}
