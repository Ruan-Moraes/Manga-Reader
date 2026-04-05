package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.domain.group.valueobject.GroupWorkStatus;
import com.mangareader.infrastructure.persistence.postgres.repository.GroupJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class GroupSeed implements EntitySeeder {
    private final GroupJpaRepository groupRepository;
    private final UserJpaRepository userRepository;

    @Override
    public int getOrder() {
        return 6;
    }

    @Override
    public void seed() {
        if (groupRepository.count() > 0) {
            log.info("Grupos já existem — seed de groups ignorado.");

            return;
        }

        var users = userRepository.findAll();

        if (users.size() < 4) return;

        var admin = users.get(3);
        var carlos = users.get(2);
        var mika = users.get(1);
        var demo = users.get(0);

        var sakura = Group.builder()
                .name("Sakura Scans")
                .username("sakura-scans")
                .logo("https://i.pravatar.cc/150?img=60")
                .banner("https://picsum.photos/1200/300?random=201")
                .description("Grupo focado em tradução de mangás shoujo e slice of life para o público brasileiro.")
                .website("https://sakurascans.example.com")
                .totalTitles(3)
                .foundedYear(2021)
                .status(GroupStatus.ACTIVE)
                .genres(List.of("Shoujo", "Slice of Life", "Romance"))
                .focusTags(List.of("Tradução", "Revisão", "Qualidade"))
                .rating(4.7)
                .popularity(92)
                .build();

        sakura.getGroupUsers().addAll(List.of(
                GroupUser.builder().group(sakura).user(admin).role(GroupRole.LIDER).build(),
                GroupUser.builder().group(sakura).user(mika).role(GroupRole.TRADUTOR).build(),
                GroupUser.builder().group(sakura).user(demo).role(GroupRole.REVISOR).build()
        ));

        sakura.getTranslatedWorks().addAll(List.of(
                GroupWork.builder()
                        .group(sakura).titleId("7").title("Coração de Porcelana")
                        .cover("https://picsum.photos/300/450?random=107").chapters(4)
                        .status(GroupWorkStatus.ONGOING).popularity(85)
                        .genres(List.of("Romance", "Shoujo", "Slice of Life")).build(),
                GroupWork.builder()
                        .group(sakura).titleId("3").title("Flores de Neon")
                        .cover("https://picsum.photos/300/450?random=103").chapters(5)
                        .status(GroupWorkStatus.COMPLETED).popularity(87)
                        .genres(List.of("Suspense", "Seinen", "Urbano")).build()
        ));

        var tempest = Group.builder()
                .name("Tempest Scans")
                .username("tempest-scans")
                .logo("https://i.pravatar.cc/150?img=62")
                .banner("https://picsum.photos/1200/300?random=202")
                .description("Tradução de manhwas e mangás de ação e fantasia. Velocidade e qualidade!")
                .website("https://tempestscans.example.com")
                .totalTitles(4)
                .foundedYear(2020)
                .status(GroupStatus.ACTIVE)
                .genres(List.of("Ação", "Fantasia", "Ficção Científica"))
                .focusTags(List.of("Manhwa", "Manhua", "Velocidade"))
                .rating(4.5)
                .popularity(95)
                .build();

        tempest.getGroupUsers().addAll(List.of(
                GroupUser.builder().group(tempest).user(carlos).role(GroupRole.LIDER).build(),
                GroupUser.builder().group(tempest).user(admin).role(GroupRole.TRADUTOR).build()
        ));

        tempest.getTranslatedWorks().addAll(List.of(
                GroupWork.builder()
                        .group(tempest).titleId("1").title("Reino de Aço")
                        .cover("https://picsum.photos/300/450?random=101").chapters(8)
                        .status(GroupWorkStatus.ONGOING).popularity(98)
                        .genres(List.of("Ação", "Fantasia", "Aventura")).build(),
                GroupWork.builder()
                        .group(tempest).titleId("2").title("Lâmina do Amanhã")
                        .cover("https://picsum.photos/300/450?random=102").chapters(6)
                        .status(GroupWorkStatus.ONGOING).popularity(94)
                        .genres(List.of("Ação", "Ficção Científica", "Drama")).build(),
                GroupWork.builder()
                        .group(tempest).titleId("6").title("Guardião Celestial")
                        .cover("https://picsum.photos/300/450?random=106").chapters(6)
                        .status(GroupWorkStatus.COMPLETED).popularity(92)
                        .genres(List.of("Fantasia", "Sobrenatural", "Aventura")).build()
        ));

        var polaris = Group.builder()
                .name("Polaris Translations")
                .username("polaris-tl")
                .logo("https://i.pravatar.cc/150?img=65")
                .banner("https://picsum.photos/1200/300?random=203")
                .description("Foco em traduções de alta qualidade para aventura e histórico. Atualmente em hiato.")
                .totalTitles(1)
                .foundedYear(2022)
                .status(GroupStatus.HIATUS)
                .genres(List.of("Aventura", "Histórico", "Fantasia"))
                .focusTags(List.of("Qualidade", "Revisão"))
                .rating(4.3)
                .popularity(78)
                .build();

        polaris.getGroupUsers().add(
                GroupUser.builder().group(polaris).user(demo).role(GroupRole.LIDER).build()
        );

        polaris.getTranslatedWorks().add(
                GroupWork.builder()
                        .group(polaris).titleId("4").title("Crônicas de Polaris")
                        .cover("https://picsum.photos/300/450?random=104").chapters(7)
                        .status(GroupWorkStatus.ONGOING).popularity(91)
                        .genres(List.of("Aventura", "Fantasia", "Histórico")).build()
        );

        groupRepository.saveAll(List.of(sakura, tempest, polaris));

        log.info("✓ 3 grupos de tradução de demonstração criados.");
    }
}
