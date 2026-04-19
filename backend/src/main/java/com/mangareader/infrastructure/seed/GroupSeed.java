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
        var roberta = users.size() > 4 ? users.get(4) : null;
        var yuki = users.size() > 7 ? users.get(7) : null;
        var sofia = users.size() > 8 ? users.get(8) : null;
        var diego = users.size() > 9 ? users.get(9) : null;

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

        var aurora = Group.builder()
                .name("Aurora Manga")
                .username("aurora-manga")
                .logo("https://i.pravatar.cc/150?img=66")
                .banner("https://picsum.photos/1200/300?random=204")
                .description("Grupo com equipe completa cobrindo todos os papéis de scanlation.")
                .website("https://auroramanga.example.com")
                .totalTitles(6)
                .foundedYear(2019)
                .status(GroupStatus.ACTIVE)
                .genres(List.of("Ação", "Aventura", "Fantasia"))
                .focusTags(List.of("Scanlation", "Equipe Completa"))
                .rating(4.8)
                .popularity(90)
                .build();

        if (roberta != null && yuki != null && sofia != null && diego != null) {
            aurora.getGroupUsers().addAll(List.of(
                    GroupUser.builder().group(aurora).user(admin).role(GroupRole.LIDER).build(),
                    GroupUser.builder().group(aurora).user(roberta).role(GroupRole.TRADUTOR).build(),
                    GroupUser.builder().group(aurora).user(carlos).role(GroupRole.REVISOR).build(),
                    GroupUser.builder().group(aurora).user(yuki).role(GroupRole.QC).build(),
                    GroupUser.builder().group(aurora).user(sofia).role(GroupRole.CLEANER).build(),
                    GroupUser.builder().group(aurora).user(diego).role(GroupRole.TYPESETTER).build()
            ));
        }

        aurora.getTranslatedWorks().add(
                GroupWork.builder()
                        .group(aurora).titleId("5").title("Vento Cortante")
                        .cover("https://picsum.photos/300/450?random=105").chapters(5)
                        .status(GroupWorkStatus.ONGOING).popularity(89)
                        .genres(List.of("Ação", "Artes Marciais", "Drama")).build()
        );

        var eclipse = Group.builder()
                .name("Eclipse Scans")
                .username("eclipse-scans")
                .logo("https://i.pravatar.cc/150?img=67")
                .banner("https://picsum.photos/1200/300?random=205")
                .description("Grupo inativo desde 2023. Traduzia mangás de suspense e horror.")
                .totalTitles(8)
                .foundedYear(2018)
                .status(GroupStatus.INACTIVE)
                .genres(List.of("Horror", "Suspense", "Seinen"))
                .focusTags(List.of("Horror", "Dark"))
                .rating(4.0)
                .popularity(55)
                .build();

        eclipse.getGroupUsers().add(
                GroupUser.builder().group(eclipse).user(carlos).role(GroupRole.LIDER).build()
        );

        var vortex = Group.builder()
                .name("Vortex Translations")
                .username("vortex-tl")
                .logo("https://i.pravatar.cc/150?img=68")
                .description("Grupo recém-criado, ainda sem membros ativos.")
                .totalTitles(0)
                .foundedYear(2025)
                .status(GroupStatus.INACTIVE)
                .genres(List.of("Romance", "Slice of Life"))
                .focusTags(List.of("Iniciante"))
                .rating(0.0)
                .popularity(5)
                .build();

        var phoenix = Group.builder()
                .name("Phoenix Manga")
                .username("phoenix-manga")
                .logo("https://i.pravatar.cc/150?img=69")
                .banner("https://picsum.photos/1200/300?random=206")
                .description("Grupo novato focado em manhuas de cultivo e fantasia chinesa.")
                .website("https://phoenixmanga.example.com")
                .totalTitles(2)
                .foundedYear(2026)
                .status(GroupStatus.ACTIVE)
                .genres(List.of("Fantasia", "Sobrenatural", "Aventura"))
                .focusTags(List.of("Manhua", "Cultivo"))
                .rating(3.5)
                .popularity(30)
                .build();

        phoenix.getGroupUsers().addAll(List.of(
                GroupUser.builder().group(phoenix).user(demo).role(GroupRole.LIDER).build(),
                GroupUser.builder().group(phoenix).user(mika).role(GroupRole.TRADUTOR).build()
        ));

        phoenix.getTranslatedWorks().add(
                GroupWork.builder()
                        .group(phoenix).titleId("6").title("Guardião Celestial")
                        .cover("https://picsum.photos/300/450?random=106").chapters(6)
                        .status(GroupWorkStatus.ONGOING).popularity(92)
                        .genres(List.of("Fantasia", "Sobrenatural", "Aventura")).build()
        );

        var solar = Group.builder()
                .name("Solar Scans")
                .username("solar-scans")
                .logo("https://i.pravatar.cc/150?img=70")
                .description("Grupo em hiato temporário por falta de equipe de tradução.")
                .totalTitles(3)
                .foundedYear(2021)
                .status(GroupStatus.HIATUS)
                .genres(List.of("Ficção Científica", "Drama"))
                .focusTags(List.of("Sci-Fi"))
                .rating(2.0)
                .popularity(35)
                .build();

        solar.getGroupUsers().add(
                GroupUser.builder().group(solar).user(mika).role(GroupRole.LIDER).build()
        );

        var lunar = Group.builder()
                .name("Lunar TL")
                .username("lunar-tl")
                .logo("https://i.pravatar.cc/150?img=71")
                .banner("https://picsum.photos/1200/300?random=207")
                .description("Pequeno grupo de tradução com foco em qualidade sobre velocidade.")
                .website("https://lunartl.example.com")
                .totalTitles(1)
                .foundedYear(2024)
                .status(GroupStatus.ACTIVE)
                .genres(List.of("Shoujo", "Romance"))
                .focusTags(List.of("Qualidade", "Romance"))
                .rating(4.9)
                .popularity(20)
                .build();

        lunar.getGroupUsers().add(
                GroupUser.builder().group(lunar).user(demo).role(GroupRole.LIDER).build()
        );

        var quantum = Group.builder()
                .name("Quantum Scans")
                .username("quantum-scans")
                .logo("https://i.pravatar.cc/150?img=72")
                .description("Grupo encerrado. Acervo transferido para outros grupos.")
                .totalTitles(0)
                .foundedYear(2020)
                .status(GroupStatus.INACTIVE)
                .genres(List.of("Ação", "Seinen"))
                .focusTags(List.of("Encerrado"))
                .rating(3.2)
                .popularity(12)
                .build();

        groupRepository.saveAll(List.of(sakura, tempest, polaris, aurora, eclipse, vortex, phoenix, solar, lunar, quantum));

        log.info("✓ 10 grupos de tradução de demonstração criados.");
    }
}
