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
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupUserType;
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
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Scan One Piece"))
                .username("scan-op")
                .build();
        groupA = entityManager.persistAndFlush(groupA);

        // Adicionar membro ao grupo A
        var member = GroupUser.builder()
                .group(groupA)
                .user(leader)
                .type(GroupUserType.MEMBER)
                .role(GroupRole.LIDER)
                .build();
        groupA.getGroupUsers().add(member);

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
                        .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Scan Naruto"))
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
            assertThat(result.get().getName().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Scan One Piece");
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
            assertThat(result.get().getName().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Scan One Piece");
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
            assertThat(result.get(0).getName().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Scan One Piece");
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
    @DisplayName("findGroupsByMemberUserId / findAvailableGroupsForUser")
    class UserGroups {

        @Test
        @DisplayName("Deve retornar grupos em que o usuário é membro")
        void deveRetornarGruposVinculados() {
            var linked = groupRepository.findGroupsByMemberUserId(leader.getId());

            assertThat(linked).hasSize(1);
            assertThat(linked.get(0).getUsername()).isEqualTo("scan-op");
        }

        @Test
        @DisplayName("DT-48: findGroupsBySupporterUserId retorna só grupos seguidos (SUPPORTER), não os de MEMBER")
        void deveRetornarGruposSeguidos() {
            var supporter = entityManager.persistAndFlush(
                    User.builder()
                            .name("Seguidor")
                            .email("seguidor@email.com")
                            .passwordHash("hash")
                            .build()
            );
            groupB.getGroupUsers().add(GroupUser.builder()
                    .group(groupB)
                    .user(supporter)
                    .type(GroupUserType.SUPPORTER)
                    .build());
            entityManager.persistAndFlush(groupB);

            var followed = groupRepository.findGroupsBySupporterUserId(supporter.getId());

            assertThat(followed).hasSize(1);
            assertThat(followed.get(0).getUsername()).isEqualTo("scan-naruto");
            // MEMBER não conta como seguido
            assertThat(groupRepository.findGroupsBySupporterUserId(leader.getId())).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar grupos em que o usuário não é membro")
        void deveRetornarGruposDisponiveis() {
            var available = groupRepository.findAvailableGroupsForUser(leader.getId());

            assertThat(available).hasSize(1);
            assertThat(available.get(0).getUsername()).isEqualTo("scan-naruto");
        }

        @Test
        @DisplayName("Deve retornar todos os grupos como disponíveis quando usuário não tem vínculos")
        void deveRetornarTodosDisponiveisSemVinculo() {
            var outsider = entityManager.persistAndFlush(
                    User.builder()
                            .name("Outsider")
                            .email("outsider@email.com")
                            .passwordHash("hash")
                            .build()
            );

            assertThat(groupRepository.findGroupsByMemberUserId(outsider.getId())).isEmpty();
            assertThat(groupRepository.findAvailableGroupsForUser(outsider.getId())).hasSize(2);
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo grupo e gerar UUID")
        void devePersistirNovoGrupo() {
            var newGroup = Group.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Scan Bleach"))
                    .username("scan-bleach")
                    .build();

            var persisted = groupRepository.save(newGroup);

            assertThat(persisted.getId()).isNotNull();
            assertThat(persisted.getName().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Scan Bleach");
        }

        @Test
        @DisplayName("Deve atualizar grupo existente")
        void deveAtualizarGrupo() {
            groupB.setName(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Scan Naruto Shippuden"));
            var updated = groupRepository.save(groupB);
            entityManager.flush();

            assertThat(updated.getName().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Scan Naruto Shippuden");
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

    @Nested
    @DisplayName("deleteWorksByTitleId")
    class DeleteWorksByTitleId {

        @Test
        @DisplayName("Deve remover obras do título e reconciliar total_titles dos grupos afetados")
        void deveRemoverObrasEReconciliar() {
            // groupA já tem a obra title-mongo-456; adiciona outra que deve permanecer
            var keep = GroupWork.builder()
                    .group(groupA).titleId("title-keep").title("Outro").build();
            groupA.getTranslatedWorks().add(keep);
            groupA.setTotalTitles(99); // drift proposital
            entityManager.persistAndFlush(groupA);
            entityManager.clear();

            groupRepository.deleteWorksByTitleId("title-mongo-456");
            entityManager.flush();
            entityManager.clear();

            assertThat(groupRepository.findByTitleId("title-mongo-456")).isEmpty();
            assertThat(groupRepository.findByTitleId("title-keep")).hasSize(1);
            assertThat(groupRepository.findById(groupA.getId()).orElseThrow().getTotalTitles())
                    .isEqualTo(1);
        }

        @Test
        @DisplayName("Não altera total_titles de grupos sem o título")
        void naoAlteraGruposSemTitulo() {
            groupB.setTotalTitles(7);
            entityManager.persistAndFlush(groupB);
            entityManager.clear();

            groupRepository.deleteWorksByTitleId("title-mongo-456");
            entityManager.flush();
            entityManager.clear();

            assertThat(groupRepository.findById(groupB.getId()).orElseThrow().getTotalTitles())
                    .isEqualTo(7);
        }
    }
}
