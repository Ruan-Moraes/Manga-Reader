package com.mangareader.infrastructure.seed;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.entity.EventTicket;
import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;
import com.mangareader.domain.forum.entity.ForumReply;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupMember;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.domain.group.valueobject.GroupWorkStatus;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreAvailability;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.infrastructure.persistence.mongo.repository.CommentMongoRepository;
import com.mangareader.infrastructure.persistence.mongo.repository.NewsMongoRepository;
import com.mangareader.infrastructure.persistence.mongo.repository.RatingMongoRepository;
import com.mangareader.infrastructure.persistence.mongo.repository.TitleMongoRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.EventJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.ForumTopicJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.GroupJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.LibraryJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.StoreJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.TagJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {
    private final UserJpaRepository userRepository;
    private final TitleMongoRepository titleRepository;
    private final CommentMongoRepository commentRepository;
    private final RatingMongoRepository ratingRepository;
    private final LibraryJpaRepository libraryRepository;
    private final GroupJpaRepository groupRepository;
    private final NewsMongoRepository newsRepository;
    private final EventJpaRepository eventRepository;
    private final ForumTopicJpaRepository forumTopicRepository;
    private final TagJpaRepository tagRepository;
    private final StoreJpaRepository storeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        seedUsers();
        seedTitles();
        seedComments();
        seedRatings();
        seedLibrary();
        seedGroups();
        seedNews();
        seedEvents();
        seedForum();
        seedTags();
        seedStores();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) {
            log.info("Usuários já existem — seed de users ignorado.");

            return;
        }

        var hash = passwordEncoder.encode("123456");

        var users = List.of(
                User.builder()
                        .name("Leitor Demo")
                        .email("demo@mangareader.com")
                        .passwordHash(hash)
                        .bio("Fã de fantasia, ação e slice of life. Sempre em busca do próximo mangá para maratonar.")
                        .photoUrl("https://i.pravatar.cc/100?img=32")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Mika Tanaka")
                        .email("mika@mangareader.com")
                        .passwordHash(hash)
                        .bio("Apaixonada por shoujo e romance. Leitora ativa desde 2018.")
                        .photoUrl("https://i.pravatar.cc/100?img=11")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Carlos Henrique")
                        .email("carlos@mangareader.com")
                        .passwordHash(hash)
                        .bio("Colecionador de edições físicas e entusiasta de seinen.")
                        .photoUrl("https://i.pravatar.cc/100?img=15")
                        .role(UserRole.MEMBER)
                        .build(),
                User.builder()
                        .name("Ana Beatriz")
                        .email("admin@mangareader.com")
                        .passwordHash(hash)
                        .bio("Tradutora amadora e revisora voluntária.")
                        .photoUrl("https://i.pravatar.cc/100?img=21")
                        .role(UserRole.ADMIN)
                        .build()
        );

        userRepository.saveAll(users);

        log.info("✓ {} usuários de demonstração criados.", users.size());
    }

    private void seedTitles() {
        if (titleRepository.count() > 0) {
            log.info("Títulos já existem — seed de titles ignorado.");

            return;
        }

        var titles = List.of(
                Title.builder()
                        .id("1")
                        .type("Mangá")
                        .name("Reino de Aço")
                        .cover("https://picsum.photos/300/450?random=101")
                        .synopsis("Em um mundo onde armaduras vivas dominam os campos de batalha, um ferreiro órfão descobre que seu sangue pode despertar a lendária Armadura Negra.")
                        .genres(List.of("Ação", "Fantasia", "Aventura"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title("O Despertar da Forja").releaseDate("2025-06-10").pages("42").build(),
                                Chapter.builder().number("2").title("Sangue e Metal").releaseDate("2025-06-17").pages("38").build(),
                                Chapter.builder().number("3").title("A Guarda Real").releaseDate("2025-06-24").pages("40").build(),
                                Chapter.builder().number("4").title("Chamas Ancestrais").releaseDate("2025-07-01").pages("36").build(),
                                Chapter.builder().number("5").title("O Pacto Sombrio").releaseDate("2025-07-08").pages("44").build(),
                                Chapter.builder().number("6").title("Cerco de Araviel").releaseDate("2025-07-15").pages("41").build(),
                                Chapter.builder().number("7").title("Alvorada Carmesim").releaseDate("2025-07-22").pages("39").build(),
                                Chapter.builder().number("8").title("O Último Forjador").releaseDate("2025-07-29").pages("45").build()
                        ))
                        .popularity("98").score("9.2")
                        .author("Takeshi Yamamoto").artist("Takeshi Yamamoto").publisher("Panini")
                        .build(),

                Title.builder()
                        .id("2")
                        .type("Manhwa")
                        .name("Lâmina do Amanhã")
                        .cover("https://picsum.photos/300/450?random=102")
                        .synopsis("Após acordar 500 anos no futuro, um espadachim medieval precisa dominar tecnologia avançada para sobreviver em uma sociedade que erradicou a violência.")
                        .genres(List.of("Ação", "Ficção Científica", "Drama"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title("Tempo Perdido").releaseDate("2025-05-01").pages("50").build(),
                                Chapter.builder().number("2").title("Neon e Lâminas").releaseDate("2025-05-08").pages("48").build(),
                                Chapter.builder().number("3").title("O Torneio Secreto").releaseDate("2025-05-15").pages("46").build(),
                                Chapter.builder().number("4").title("Ecos do Passado").releaseDate("2025-05-22").pages("52").build(),
                                Chapter.builder().number("5").title("A Arena de Vidro").releaseDate("2025-05-29").pages("44").build(),
                                Chapter.builder().number("6").title("Alianças Frágeis").releaseDate("2025-06-05").pages("47").build()
                        ))
                        .popularity("94").score("8.9")
                        .author("Park Ji-Won").artist("Lee Soo-Hyun").publisher("NewPOP")
                        .build(),

                Title.builder()
                        .id("3")
                        .type("Mangá")
                        .name("Flores de Neon")
                        .cover("https://picsum.photos/300/450?random=103")
                        .synopsis("Em Tóquio, uma florista de dia e hacker de noite se vê envolvida em uma conspiração corporativa quando suas duas vidas colidem.")
                        .genres(List.of("Suspense", "Seinen", "Urbano"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title("Pétalas Digitais").releaseDate("2025-04-05").pages("40").build(),
                                Chapter.builder().number("2").title("Código Verde").releaseDate("2025-04-12").pages("38").build(),
                                Chapter.builder().number("3").title("Raízes Cortadas").releaseDate("2025-04-19").pages("42").build(),
                                Chapter.builder().number("4").title("Firewall").releaseDate("2025-04-26").pages("36").build(),
                                Chapter.builder().number("5").title("Florescer no Caos").releaseDate("2025-05-03").pages("44").build()
                        ))
                        .popularity("87").score("8.5")
                        .author("Yuki Aoi").artist("Yuki Aoi").publisher("JBC")
                        .build(),

                Title.builder()
                        .id("4")
                        .type("Mangá")
                        .name("Crônicas de Polaris")
                        .cover("https://picsum.photos/300/450?random=104")
                        .synopsis("Um grupo de exploradores parte rumo à estrela Polaris seguindo mapas antigos que prometem revelar a origem da humanidade.")
                        .genres(List.of("Aventura", "Fantasia", "Histórico"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title("O Mapa Estelar").releaseDate("2025-03-01").pages("46").build(),
                                Chapter.builder().number("2").title("Terras Proibidas").releaseDate("2025-03-08").pages("42").build(),
                                Chapter.builder().number("3").title("O Rio de Cristal").releaseDate("2025-03-15").pages("40").build(),
                                Chapter.builder().number("4").title("Tempestade de Areia").releaseDate("2025-03-22").pages("38").build(),
                                Chapter.builder().number("5").title("O Farol Esquecido").releaseDate("2025-03-29").pages("48").build(),
                                Chapter.builder().number("6").title("Estrelas Perdidas").releaseDate("2025-04-05").pages("45").build(),
                                Chapter.builder().number("7").title("A Cidade Flutuante").releaseDate("2025-04-12").pages("43").build()
                        ))
                        .popularity("91").score("8.7")
                        .author("Hiroshi Tanaka").artist("Hiroshi Tanaka").publisher("Panini")
                        .build(),

                Title.builder()
                        .id("5")
                        .type("Manhwa")
                        .name("Vento Cortante")
                        .cover("https://picsum.photos/300/450?random=105")
                        .synopsis("Um jovem artista marcial descobre que possui a habilidade rara de cortar o vento, tornando-se alvo de clãs rivais que desejam dominar essa técnica lendária.")
                        .genres(List.of("Ação", "Artes Marciais", "Drama"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title("O Primeiro Corte").releaseDate("2025-02-14").pages("44").build(),
                                Chapter.builder().number("2").title("Discípulo Relutante").releaseDate("2025-02-21").pages("40").build(),
                                Chapter.builder().number("3").title("Ventos do Norte").releaseDate("2025-02-28").pages("42").build(),
                                Chapter.builder().number("4").title("A Montanha Sagrada").releaseDate("2025-03-07").pages("46").build(),
                                Chapter.builder().number("5").title("Duelo ao Amanhecer").releaseDate("2025-03-14").pages("48").build()
                        ))
                        .popularity("89").score("8.6")
                        .author("Kim Dae-Sung").artist("Kim Dae-Sung").publisher("NewPOP")
                        .build(),

                Title.builder()
                        .id("6")
                        .type("Manhua")
                        .name("Guardião Celestial")
                        .cover("https://picsum.photos/300/450?random=106")
                        .synopsis("Quando os portões celestiais se abrem, um jovem monge é escolhido como o último guardião entre o mundo mortal e o reino dos deuses.")
                        .genres(List.of("Fantasia", "Sobrenatural", "Aventura"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title("Os Portões Abertos").releaseDate("2025-01-10").pages("50").build(),
                                Chapter.builder().number("2").title("O Selo Partido").releaseDate("2025-01-17").pages("46").build(),
                                Chapter.builder().number("3").title("Caminho do Monge").releaseDate("2025-01-24").pages("44").build(),
                                Chapter.builder().number("4").title("Espíritos Errantes").releaseDate("2025-01-31").pages("48").build(),
                                Chapter.builder().number("5").title("A Espada Divina").releaseDate("2025-02-07").pages("52").build(),
                                Chapter.builder().number("6").title("Ascensão Celestial").releaseDate("2025-02-14").pages("50").build()
                        ))
                        .popularity("92").score("8.8")
                        .author("Chen Wei").artist("Liu Xing").publisher("Panini")
                        .build(),

                Title.builder()
                        .id("7")
                        .type("Mangá")
                        .name("Coração de Porcelana")
                        .cover("https://picsum.photos/300/450?random=107")
                        .synopsis("Uma jovem artesã de porcelana descobre que suas criações ganham vida própria, revelando sentimentos que ela há muito tempo tentava esconder.")
                        .genres(List.of("Romance", "Shoujo", "Slice of Life"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title("A Primeira Peça").releaseDate("2025-04-01").pages("36").build(),
                                Chapter.builder().number("2").title("Cores do Coração").releaseDate("2025-04-08").pages("34").build(),
                                Chapter.builder().number("3").title("Fragmentos").releaseDate("2025-04-15").pages("38").build(),
                                Chapter.builder().number("4").title("O Restaurador").releaseDate("2025-04-22").pages("36").build()
                        ))
                        .popularity("85").score("8.3")
                        .author("Sakura Miyazaki").artist("Sakura Miyazaki").publisher("JBC")
                        .build(),

                Title.builder()
                        .id("8")
                        .type("Manhwa")
                        .name("Protocolo Zero")
                        .cover("https://picsum.photos/300/450?random=108")
                        .synopsis("Em um futuro distópico, um programador descobre que a IA governante esconde um protocolo secreto que pode libertar ou destruir a humanidade.")
                        .genres(List.of("Ficção Científica", "Thriller", "Seinen"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title("Linha de Código").releaseDate("2025-05-10").pages("48").build(),
                                Chapter.builder().number("2").title("Bugado").releaseDate("2025-05-17").pages("44").build(),
                                Chapter.builder().number("3").title("Firewall Humana").releaseDate("2025-05-24").pages("46").build(),
                                Chapter.builder().number("4").title("Override").releaseDate("2025-05-31").pages("42").build(),
                                Chapter.builder().number("5").title("Protocolo Ativado").releaseDate("2025-06-07").pages("50").build()
                        ))
                        .popularity("90").score("8.8")
                        .author("Park Min-Ho").artist("Park Min-Ho").publisher("NewPOP")
                        .build()
        );

        titleRepository.saveAll(titles);

        log.info("✓ {} títulos de demonstração criados.", titles.size());
    }

    private void seedComments() {
        if (commentRepository.count() > 0) {
            log.info("Comentários já existem — seed de comments ignorado.");

            return;
        }

        var comments = List.of(
                Comment.builder().id("c-1-1").titleId("1").parentCommentId(null)
                        .userId("seed-user-3").userName("Carlos Henrique").userPhoto("https://i.pravatar.cc/100?img=15")
                        .isHighlighted(true).textContent("A arte desse mangá é absurda! Cada painel parece uma pintura. Não consigo parar de ler.")
                        .likeCount(24).dislikeCount(1).build(),
                Comment.builder().id("c-1-2").titleId("1").parentCommentId("c-1-1")
                        .userId("seed-user-1").userName("Leitor Demo").userPhoto("https://i.pravatar.cc/100?img=32")
                        .textContent("Concordo totalmente! O capítulo 5 foi o melhor até agora.")
                        .likeCount(8).dislikeCount(0).build(),
                Comment.builder().id("c-1-3").titleId("1").parentCommentId(null)
                        .userId("seed-user-5").userName("Rui Oliveira").userPhoto("https://i.pravatar.cc/100?img=33")
                        .wasEdited(true).textContent("Achei o ritmo um pouco lento nos primeiros capítulos, mas depois melhora muito.")
                        .likeCount(12).dislikeCount(3).build(),
                Comment.builder().id("c-1-4").titleId("1").parentCommentId("c-1-3")
                        .userId("seed-user-7").userName("João Pedro").userPhoto("https://i.pravatar.cc/100?img=52")
                        .textContent("Vale a pena a paciência. O clímax é épico.")
                        .likeCount(15).dislikeCount(0).build(),
                Comment.builder().id("c-2-1").titleId("2").parentCommentId(null)
                        .userId("seed-user-7").userName("João Pedro").userPhoto("https://i.pravatar.cc/100?img=52")
                        .textContent("Manhwa com premissa incrível! A mistura de medieval com sci-fi funciona demais.")
                        .likeCount(18).dislikeCount(2).build(),
                Comment.builder().id("c-2-2").titleId("2").parentCommentId(null)
                        .userId("seed-user-2").userName("Mika Tanaka").userPhoto("https://i.pravatar.cc/100?img=11")
                        .textContent("Os torneios clandestinos são o ponto alto. Muita adrenalina!")
                        .likeCount(14).dislikeCount(0).build(),
                Comment.builder().id("c-3-1").titleId("3").parentCommentId(null)
                        .userId("seed-user-6").userName("Ester Nakamura").userPhoto("https://i.pravatar.cc/100?img=44")
                        .isHighlighted(true).textContent("Suspense urbano bem construído. A protagonista é muito carismática.")
                        .likeCount(20).dislikeCount(1).build(),
                Comment.builder().id("c-3-2").titleId("3").parentCommentId("c-3-1")
                        .userId("seed-user-1").userName("Leitor Demo").userPhoto("https://i.pravatar.cc/100?img=32")
                        .textContent("Sim! A cena do capítulo 4 me deixou sem fôlego.")
                        .likeCount(9).dislikeCount(0).build(),
                Comment.builder().id("c-5-1").titleId("5").parentCommentId(null)
                        .userId("seed-user-5").userName("Rui Oliveira").userPhoto("https://i.pravatar.cc/100?img=33")
                        .textContent("Artes marciais + drama pesado = combinação perfeita. Nota 10!")
                        .likeCount(22).dislikeCount(0).build()
        );

        commentRepository.saveAll(comments);

        log.info("✓ {} comentários de demonstração criados.", comments.size());
    }

    private void seedRatings() {
        if (ratingRepository.count() > 0) {
            log.info("Avaliações já existem — seed de ratings ignorado.");

            return;
        }

        String[] userNames = {"Ana", "Carlos", "Mika", "Rui", "João", "Ester", "Nina", "Leo", "Sakura", "Dante"};

        String[] ratingComments = {
                "Arte impecável e história viciante.",
                "Ritmo bom, mas alguns capítulos são lentos.",
                "Gostei muito do desenvolvimento dos personagens.",
                "Leitura leve para maratonar no fim de semana.",
                "Final do último arco foi excelente.",
                "Tradução boa e capítulos bem consistentes.",
                "Recomendo para quem gosta do gênero.",
                "Cenários maravilhosos e painéis detalhados."
        };

        String[] categoryKeys = {"Diversion", "Art", "Storyline", "Characters", "Originality", "Pacing"};

        for (int titleIdx = 0; titleIdx < 8; titleIdx++) {
            String titleId = String.valueOf(titleIdx + 1);

            int amount = 3 + ((titleIdx * 7 + 3) % 8); // 3-10 ratings por título

            for (int i = 0; i < amount; i++) {
                int seed = titleIdx * 100 + i;

                double stars = 1 + (seed % 5);

                Map<String, Double> catRatings = new java.util.HashMap<>();

                for (int k = 0; k < categoryKeys.length; k++) {
                    double base = ((seed + k * 3) % 9) + 1;

                    double val = base * 0.5;

                    catRatings.put(categoryKeys[k], Math.max(1.0, Math.min(5.0, val)));
                }

                MangaRating rating = MangaRating.builder()
                        .id(titleId + "-" + i)
                        .titleId(titleId)
                        .userId("seed-rating-" + seed)
                        .userName(userNames[seed % userNames.length])
                        .stars(stars)
                        .comment(seed % 3 != 0 ? ratingComments[seed % ratingComments.length] : null)
                        .categoryRatings(catRatings)
                        .build();

                ratingRepository.save(rating);
            }
        }

        log.info("✓ Avaliações de demonstração criadas para 8 títulos.");
    }

    private void seedLibrary() {
        if (libraryRepository.count() > 0) {
            log.info("Biblioteca já existe — seed de library ignorado.");

            return;
        }

        var users = userRepository.findAll();

        if (users.isEmpty()) return;

        var demoUser = users.get(0); // Leitor Demo
        var mika = users.get(1);     // Mika Tanaka

        var saved = List.of(
                SavedManga.builder()
                        .user(demoUser).titleId("1").name("Reino de Aço")
                        .cover("https://picsum.photos/300/450?random=101").type("Mangá")
                        .list(ReadingListType.LENDO).build(),
                SavedManga.builder()
                        .user(demoUser).titleId("3").name("Flores de Neon")
                        .cover("https://picsum.photos/300/450?random=103").type("Mangá")
                        .list(ReadingListType.LENDO).build(),
                SavedManga.builder()
                        .user(demoUser).titleId("4").name("Crônicas de Polaris")
                        .cover("https://picsum.photos/300/450?random=104").type("Mangá")
                        .list(ReadingListType.QUERO_LER).build(),
                SavedManga.builder()
                        .user(demoUser).titleId("7").name("Coração de Porcelana")
                        .cover("https://picsum.photos/300/450?random=107").type("Mangá")
                        .list(ReadingListType.CONCLUIDO).build(),
                SavedManga.builder()
                        .user(demoUser).titleId("6").name("Guardião Celestial")
                        .cover("https://picsum.photos/300/450?random=106").type("Manhua")
                        .list(ReadingListType.QUERO_LER).build(),
                SavedManga.builder()
                        .user(mika).titleId("2").name("Lâmina do Amanhã")
                        .cover("https://picsum.photos/300/450?random=102").type("Manhwa")
                        .list(ReadingListType.LENDO).build(),
                SavedManga.builder()
                        .user(mika).titleId("7").name("Coração de Porcelana")
                        .cover("https://picsum.photos/300/450?random=107").type("Mangá")
                        .list(ReadingListType.LENDO).build()
        );

        libraryRepository.saveAll(saved);

        log.info("✓ {} itens de biblioteca de demonstração criados.", saved.size());
    }

    private void seedGroups() {
        if (groupRepository.count() > 0) {
            log.info("Grupos já existem — seed de groups ignorado.");

            return;
        }

        var users = userRepository.findAll();

        if (users.size() < 4) return;

        var admin = users.get(3);     // Ana Beatriz (admin)
        var carlos = users.get(2);    // Carlos Henrique
        var mika = users.get(1);      // Mika Tanaka
        var demo = users.get(0);      // Leitor Demo

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

        var sakuraMember1 = GroupMember.builder()
                .group(sakura).user(admin).role(GroupRole.LIDER).build();
        var sakuraMember2 = GroupMember.builder()
                .group(sakura).user(mika).role(GroupRole.TRADUTOR).build();
        var sakuraMember3 = GroupMember.builder()
                .group(sakura).user(demo).role(GroupRole.REVISOR).build();

        sakura.getMembers().addAll(List.of(sakuraMember1, sakuraMember2, sakuraMember3));

        var sakuraWork1 = GroupWork.builder()
                .group(sakura).titleId("7").title("Coração de Porcelana")
                .cover("https://picsum.photos/300/450?random=107").chapters(4)
                .status(GroupWorkStatus.ONGOING).popularity(85)
                .genres(List.of("Romance", "Shoujo", "Slice of Life")).build();
        var sakuraWork2 = GroupWork.builder()
                .group(sakura).titleId("3").title("Flores de Neon")
                .cover("https://picsum.photos/300/450?random=103").chapters(5)
                .status(GroupWorkStatus.COMPLETED).popularity(87)
                .genres(List.of("Suspense", "Seinen", "Urbano")).build();

        sakura.getTranslatedWorks().addAll(List.of(sakuraWork1, sakuraWork2));

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

        var tempestMember1 = GroupMember.builder()
                .group(tempest).user(carlos).role(GroupRole.LIDER).build();
        var tempestMember2 = GroupMember.builder()
                .group(tempest).user(admin).role(GroupRole.TRADUTOR).build();

        tempest.getMembers().addAll(List.of(tempestMember1, tempestMember2));

        var tempestWork1 = GroupWork.builder()
                .group(tempest).titleId("1").title("Reino de Aço")
                .cover("https://picsum.photos/300/450?random=101").chapters(8)
                .status(GroupWorkStatus.ONGOING).popularity(98)
                .genres(List.of("Ação", "Fantasia", "Aventura")).build();
        var tempestWork2 = GroupWork.builder()
                .group(tempest).titleId("2").title("Lâmina do Amanhã")
                .cover("https://picsum.photos/300/450?random=102").chapters(6)
                .status(GroupWorkStatus.ONGOING).popularity(94)
                .genres(List.of("Ação", "Ficção Científica", "Drama")).build();
        var tempestWork3 = GroupWork.builder()
                .group(tempest).titleId("6").title("Guardião Celestial")
                .cover("https://picsum.photos/300/450?random=106").chapters(6)
                .status(GroupWorkStatus.COMPLETED).popularity(92)
                .genres(List.of("Fantasia", "Sobrenatural", "Aventura")).build();

        tempest.getTranslatedWorks().addAll(List.of(tempestWork1, tempestWork2, tempestWork3));

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

        var polarisMember1 = GroupMember.builder()
                .group(polaris).user(demo).role(GroupRole.LIDER).build();

        polaris.getMembers().add(polarisMember1);

        var polarisWork1 = GroupWork.builder()
                .group(polaris).titleId("4").title("Crônicas de Polaris")
                .cover("https://picsum.photos/300/450?random=104").chapters(7)
                .status(GroupWorkStatus.ONGOING).popularity(91)
                .genres(List.of("Aventura", "Fantasia", "Histórico")).build();

        polaris.getTranslatedWorks().add(polarisWork1);

        groupRepository.saveAll(List.of(sakura, tempest, polaris));

        log.info("✓ 3 grupos de tradução de demonstração criados.");
    }

    private void seedNews() {
        if (newsRepository.count() > 0) {
            log.info("Notícias já existem — seed de news ignorado.");

            return;
        }

        var authorRedacao = NewsAuthor.builder()
                .id("author-1").name("Redação MangaReader")
                .avatar("https://i.pravatar.cc/100?img=50")
                .role("Editor").profileLink("/profile/redacao").build();

        var authorColunista = NewsAuthor.builder()
                .id("author-2").name("Yuki Sato")
                .avatar("https://i.pravatar.cc/100?img=23")
                .role("Colunista").profileLink("/profile/yuki-sato").build();

        var news = List.of(
                NewsItem.builder()
                        .id("news-1")
                        .title("Novo mangá de fantasia 'Reino de Aço' bate recordes de vendas")
                        .subtitle("A obra ultrapassou 500 mil cópias vendidas em apenas 3 meses")
                        .excerpt("O mangá de estreia de Takeshi Yamamoto se consolida como o grande sucesso do ano.")
                        .content(List.of(
                                "O mangá 'Reino de Aço' alcançou a marca de 500 mil cópias vendidas, confirmando-se como um dos maiores lançamentos do ano.",
                                "A obra, que narra a jornada de um ferreiro órfão em um mundo dominado por armaduras vivas, vem conquistando leitores com sua arte detalhada e história envolvente.",
                                "Segundo a editora Panini, uma adaptação para anime já está em negociação com estúdios japoneses."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=301")
                        .source("Panini Comics").sourceLogo("https://picsum.photos/50/50?random=401")
                        .category(NewsCategory.LANCAMENTOS)
                        .tags(List.of("Reino de Aço", "Vendas", "Mangá", "Panini"))
                        .author(authorRedacao)
                        .readTime(4).views(3200).commentsCount(45).trendingScore(95)
                        .isFeatured(true)
                        .reactions(NewsReaction.builder().like(180).excited(92).sad(3).surprised(24).build())
                        .build(),
                NewsItem.builder()
                        .id("news-2")
                        .title("Solo Leveling confirma 3ª temporada do anime para 2026")
                        .subtitle("A-1 Pictures retorna para animar o arco mais aguardado")
                        .excerpt("Fãs comemoram a confirmação da terceira temporada com trailer inédito.")
                        .content(List.of(
                                "A Crunchyroll confirmou oficialmente que a terceira temporada de Solo Leveling será produzida pela A-1 Pictures.",
                                "O novo arco adaptará os volumes 8 a 11 da light novel, incluindo o aguardado 'Arco da Ilha Jeju'.",
                                "A estreia está prevista para outubro de 2026."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=302")
                        .source("Crunchyroll").sourceLogo("https://picsum.photos/50/50?random=402")
                        .category(NewsCategory.ADAPTACOES)
                        .tags(List.of("Solo Leveling", "Anime", "A-1 Pictures"))
                        .author(authorColunista)
                        .readTime(3).views(8500).commentsCount(120).trendingScore(98)
                        .isExclusive(true).isFeatured(true)
                        .reactions(NewsReaction.builder().like(450).excited(320).sad(5).surprised(67).build())
                        .build(),
                NewsItem.builder()
                        .id("news-3")
                        .title("Guia: os melhores mangás de 2025 segundo os leitores")
                        .subtitle("Votação aberta elegeu os favoritos do público brasileiro")
                        .excerpt("Confira a lista completa com os 10 mangás mais votados.")
                        .content(List.of(
                                "A comunidade MangaReader elegeu os 10 melhores mangás de 2025 em votação aberta que reuniu mais de 50 mil participantes.",
                                "No topo da lista está 'Reino de Aço', seguido por 'Flores de Neon' e 'Crônicas de Polaris'.",
                                "A lista completa inclui obras de diversos gêneros, mostrando a diversidade do público leitor."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=303")
                        .source("MangaReader").sourceLogo("https://picsum.photos/50/50?random=403")
                        .category(NewsCategory.PRINCIPAIS)
                        .tags(List.of("Top 10", "2025", "Votação", "Comunidade"))
                        .author(authorRedacao)
                        .readTime(6).views(5400).commentsCount(78).trendingScore(88)
                        .reactions(NewsReaction.builder().like(210).excited(45).sad(12).surprised(8).build())
                        .build(),
                NewsItem.builder()
                        .id("news-4")
                        .title("Editora NewPOP anuncia 5 novos manhwas para o catálogo brasileiro")
                        .subtitle("Lançamentos incluem obras de ação, romance e fantasia")
                        .excerpt("A editora continua expandindo seu catálogo de webtoons coreanos traduzidos.")
                        .content(List.of(
                                "A NewPOP anunciou a adição de 5 novos manhwas ao seu catálogo, com lançamentos previstos para o segundo semestre de 2026.",
                                "Entre os títulos confirmados estão obras dos gêneros ação, romance e fantasia, com foco no público jovem adulto.",
                                "Os volumes físicos terão edição especial com capa variante no primeiro mês."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=304")
                        .source("NewPOP").sourceLogo("https://picsum.photos/50/50?random=404")
                        .category(NewsCategory.LANCAMENTOS)
                        .tags(List.of("NewPOP", "Manhwa", "Lançamento"))
                        .author(authorColunista)
                        .readTime(3).views(2100).commentsCount(34).trendingScore(72)
                        .reactions(NewsReaction.builder().like(98).excited(56).sad(2).surprised(15).build())
                        .build(),
                NewsItem.builder()
                        .id("news-5")
                        .title("Entrevista exclusiva: Hiroshi Tanaka fala sobre Crônicas de Polaris")
                        .subtitle("Autor revela inspirações e adianta novidades sobre o arco final")
                        .excerpt("Em entrevista ao MangaReader, o criador de Crônicas de Polaris compartilha os bastidores da obra.")
                        .content(List.of(
                                "Em uma entrevista exclusiva, Hiroshi Tanaka revelou que a inspiração para Crônicas de Polaris veio de viagens pela América do Sul.",
                                "O autor confirmou que a obra terá um arco final com 30 capítulos, previsto para começar no próximo trimestre.",
                                "Tanaka também mencionou interesse em colaborações com outros mangakás brasileiros para projetos futuros."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=305")
                        .source("MangaReader").sourceLogo("https://picsum.photos/50/50?random=405")
                        .category(NewsCategory.ENTREVISTAS)
                        .tags(List.of("Hiroshi Tanaka", "Crônicas de Polaris", "Entrevista"))
                        .author(authorRedacao)
                        .readTime(8).views(4300).commentsCount(56).trendingScore(82)
                        .isExclusive(true)
                        .reactions(NewsReaction.builder().like(156).excited(78).sad(8).surprised(42).build())
                        .build()
        );

        newsRepository.saveAll(news);

        log.info("✓ {} notícias de demonstração criadas.", news.size());
    }


    private void seedEvents() {
        if (eventRepository.count() > 0) {
            log.info("Eventos já existem — seed de events ignorado.");

            return;
        }

        var now = LocalDateTime.now();

        var animeCon = Event.builder()
                .title("AnimeCon SP 2026")
                .subtitle("O maior evento de anime e mangá do Brasil")
                .description("A AnimeCon SP reúne milhares de fãs para celebrar a cultura otaku com painéis, cosplay, artistas convidados e lançamentos exclusivos.")
                .image("https://picsum.photos/1200/600?random=501")
                .gallery(List.of("https://picsum.photos/800/450?random=502", "https://picsum.photos/800/450?random=503"))
                .startDate(now.plusDays(30))
                .endDate(now.plusDays(32))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.REGISTRATIONS_OPEN)
                .type(EventType.CONVENCAO)
                .location(EventLocation.builder()
                        .label("São Paulo Expo").address("Rod. dos Imigrantes, 1,5 km")
                        .city("São Paulo").isOnline(false)
                        .mapLink("https://maps.google.com/?q=Sao+Paulo+Expo")
                        .directions("Próximo ao metrô Jabaquara").build())
                .organizer(EventOrganizer.builder()
                        .organizerId("org-1").organizerName("AnimeCon Brasil")
                        .organizerAvatar("https://i.pravatar.cc/100?img=40")
                        .organizerProfileLink("/profile/animecon")
                        .organizerContact("contato@animecon.com.br").build())
                .priceLabel("A partir de R$ 89,90")
                .participants(1200).interested(4500).isFeatured(true)
                .schedule(List.of(
                        "10:00 - Abertura dos portões",
                        "11:00 - Painel: O futuro do mangá no Brasil",
                        "14:00 - Concurso de Cosplay",
                        "16:00 - Meet & Greet com artistas",
                        "19:00 - Encerramento"
                ))
                .specialGuests(List.of("Takeshi Yamamoto (autor de Reino de Aço)", "Yuki Sato (colunista)"))
                .build();

        var ticket1 = EventTicket.builder().event(animeCon).name("Ingresso Dia Único").price("R$ 89,90").available(500).build();
        var ticket2 = EventTicket.builder().event(animeCon).name("Passaporte 3 Dias").price("R$ 199,90").available(200).build();
        var ticket3 = EventTicket.builder().event(animeCon).name("VIP + Meet & Greet").price("R$ 349,90").available(50).build();
        animeCon.getTickets().addAll(List.of(ticket1, ticket2, ticket3));

        var autografos = Event.builder()
                .title("Noite de Autógrafos — Hiroshi Tanaka")
                .subtitle("Sessão exclusiva com o autor de Crônicas de Polaris")
                .description("Hiroshi Tanaka estará presente para uma sessão de autógrafos e bate-papo sobre a criação de Crônicas de Polaris.")
                .image("https://picsum.photos/1200/600?random=504")
                .startDate(now.plusDays(45))
                .endDate(now.plusDays(45).plusHours(3))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.COMING_SOON)
                .type(EventType.LANCAMENTO)
                .location(EventLocation.builder()
                        .label("Livraria Cultura — Conjunto Nacional")
                        .address("Av. Paulista, 2073").city("São Paulo")
                        .isOnline(false).mapLink("https://maps.google.com/?q=Livraria+Cultura+Paulista")
                        .directions("Metrô Consolação").build())
                .organizer(EventOrganizer.builder()
                        .organizerId("org-2").organizerName("Panini Comics")
                        .organizerAvatar("https://i.pravatar.cc/100?img=41")
                        .organizerProfileLink("/profile/panini")
                        .organizerContact("eventos@panini.com.br").build())
                .priceLabel("Gratuito com compra do volume")
                .participants(80).interested(350)
                .schedule(List.of(
                        "18:00 - Abertura",
                        "18:30 - Bate-papo com Hiroshi Tanaka",
                        "19:30 - Sessão de autógrafos",
                        "21:00 - Encerramento"
                ))
                .specialGuests(List.of("Hiroshi Tanaka"))
                .build();

        var ticketAut = EventTicket.builder().event(autografos).name("Acesso com livro").price("Gratuito").available(100).build();

        autografos.getTickets().add(ticketAut);

        var live = Event.builder()
                .title("Live: Análise dos Lançamentos de Março")
                .subtitle("Resenha ao vivo dos principais lançamentos do mês")
                .description("Junte-se à equipe MangaReader para uma análise ao vivo dos mangás lançados em março de 2026.")
                .image("https://picsum.photos/1200/600?random=505")
                .startDate(now.minusHours(1))
                .endDate(now.plusHours(2))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.ONGOING)
                .status(EventStatus.HAPPENING_NOW)
                .type(EventType.LIVE)
                .location(EventLocation.builder()
                        .label("YouTube / Twitch").address("Online")
                        .city("Online").isOnline(true)
                        .mapLink("https://youtube.com/@mangareader").build())
                .organizer(EventOrganizer.builder()
                        .organizerId("org-3").organizerName("MangaReader")
                        .organizerAvatar("https://i.pravatar.cc/100?img=42")
                        .organizerProfileLink("/profile/mangareader")
                        .organizerContact("live@mangareader.com").build())
                .priceLabel("Gratuito")
                .participants(340).interested(1200).isFeatured(true)
                .build();

        var workshop = Event.builder()
                .title("Workshop: Introdução ao Desenho de Mangá")
                .subtitle("Aprenda as bases do estilo mangá com profissionais")
                .description("Workshop prático para iniciantes que querem aprender a desenhar no estilo mangá.")
                .image("https://picsum.photos/1200/600?random=506")
                .startDate(now.minusDays(15))
                .endDate(now.minusDays(15).plusHours(4))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.PAST)
                .status(EventStatus.ENDED)
                .type(EventType.WORKSHOP)
                .location(EventLocation.builder()
                        .label("SESC Pompeia").address("Rua Clélia, 93")
                        .city("São Paulo").isOnline(false)
                        .mapLink("https://maps.google.com/?q=SESC+Pompeia").build())
                .organizer(EventOrganizer.builder()
                        .organizerId("org-4").organizerName("SESC SP")
                        .organizerAvatar("https://i.pravatar.cc/100?img=43")
                        .organizerProfileLink("/profile/sesc")
                        .organizerContact("cultural@sescsp.org.br").build())
                .priceLabel("R$ 25,00")
                .participants(60).interested(200)
                .build();

        eventRepository.saveAll(List.of(animeCon, autografos, live, workshop));

        log.info("✓ 4 eventos de demonstração criados.");
    }

    private void seedForum() {
        if (forumTopicRepository.count() > 0) {
            log.info("Fórum já existe — seed de forum ignorado.");

            return;
        }

        var users = userRepository.findAll();

        if (users.size() < 4) return;

        var demo = users.get(0);   // Leitor Demo
        var mika = users.get(1);   // Mika Tanaka
        var carlos = users.get(2); // Carlos Henrique
        var admin = users.get(3);  // Ana Beatriz (admin)

        var regras = ForumTopic.builder()
                .author(admin)
                .title("📌 Regras do Fórum — Leia antes de postar")
                .content("Bem-vindos ao fórum MangaReader! Antes de participar, por favor leia as regras:\n\n1. Respeite todos os membros.\n2. Use tags de spoiler quando necessário.\n3. Não faça spam ou autopromoção.\n4. Contribua de forma construtiva.\n5. Divirta-se!")
                .category(ForumCategory.GERAL)
                .tags(List.of("Regras", "Importante"))
                .isPinned(true)
                .viewCount(2340).likeCount(56)
                .build();

        var regraReply1 = ForumReply.builder()
                .topic(regras).author(demo)
                .content("Obrigado por organizar as regras! Fórum muito bem moderado.")
                .likes(12).build();
        var regraReply2 = ForumReply.builder()
                .topic(regras).author(mika)
                .content("Excelente! Concordo com todas as regras. 💯")
                .likes(8).build();

        regras.getReplies().addAll(List.of(regraReply1, regraReply2));
        regras.setReplyCount(2);

        var onePiece = ForumTopic.builder()
                .author(carlos)
                .title("One Piece: o final será satisfatório? [SPOILERS]")
                .content("Com One Piece se aproximando do arco final, vocês acham que Oda vai conseguir encerrar de forma satisfatória? São tantas tramas abertas...\n\nPessoalmente, estou preocupado com o ritmo dos últimos capítulos.")
                .category(ForumCategory.GERAL)
                .tags(List.of("One Piece", "Discussão", "Spoilers"))
                .viewCount(1890).replyCount(3).likeCount(43)
                .build();

        var opReply1 = ForumReply.builder()
                .topic(onePiece).author(demo)
                .content("Eu confio no Oda. Ele sempre surpreende quando menos esperamos.")
                .likes(15).build();
        var opReply2 = ForumReply.builder()
                .topic(onePiece).author(mika)
                .content("Acho que o arco final vai ser longo o suficiente para resolver tudo.")
                .likes(9).build();
        var opReply3 = ForumReply.builder()
                .topic(onePiece).author(admin)
                .content("Lembrem de usar a tag de spoiler nos comentários mais detalhados!")
                .likes(6).build();

        onePiece.getReplies().addAll(List.of(opReply1, opReply2, opReply3));

        var recomendacao = ForumTopic.builder()
                .author(mika)
                .title("Recomendem mangás de romance parecidos com Coração de Porcelana")
                .content("Acabei de ler Coração de Porcelana e estou apaixonada! Alguém conhece outros mangás shoujo com essa vibe de arte delicada e romance lento?")
                .category(ForumCategory.RECOMENDACOES)
                .tags(List.of("Romance", "Shoujo", "Recomendação"))
                .viewCount(567).replyCount(2).likeCount(28)
                .build();

        var recReply1 = ForumReply.builder()
                .topic(recomendacao).author(carlos)
                .content("Tenta ler 'Your Lie in April' se ainda não leu. A arte é linda e a história é emocionante.")
                .likes(11).build();
        var recReply2 = ForumReply.builder()
                .topic(recomendacao).author(demo)
                .content("Fruits Basket (edição completa) é perfeito para esse estilo!")
                .likes(14).isBestAnswer(true).build();

        recomendacao.getReplies().addAll(List.of(recReply1, recReply2));
        recomendacao.setSolved(true);

        var teoria = ForumTopic.builder()
                .author(demo)
                .title("Teoria: o verdadeiro poder da Armadura Negra em Reino de Aço")
                .content("Tenho uma teoria sobre a Armadura Negra baseada nos capítulos 5-8. O sangue do protagonista não apenas desperta a armadura, mas pode estar conectado a algo muito maior...\n\nAlguém mais percebeu a semelhança entre os símbolos da forja ancestral e os brasões do capítulo 3?")
                .category(ForumCategory.TEORIAS)
                .tags(List.of("Reino de Aço", "Teoria", "Spoilers"))
                .viewCount(423).replyCount(1).likeCount(35)
                .build();

        var teoriaReply = ForumReply.builder()
                .topic(teoria).author(carlos)
                .content("Cara, eu pensei a mesma coisa! Os símbolos são idênticos. Acho que o ferreiro é descendente dos antigos forjadores reais.")
                .likes(20).build();

        teoria.getReplies().add(teoriaReply);

        var suporte = ForumTopic.builder()
                .author(mika)
                .title("Como salvar mangás na biblioteca?")
                .content("Sou nova na plataforma e não estou conseguindo salvar mangás na minha biblioteca. Alguém pode me ajudar?")
                .category(ForumCategory.SUPORTE)
                .tags(List.of("Ajuda", "Biblioteca"))
                .viewCount(120).replyCount(1).likeCount(5)
                .isSolved(true)
                .build();

        var suporteReply = ForumReply.builder()
                .topic(suporte).author(admin)
                .content("Oi Mika! Na página de qualquer título, clique no botão 'Salvar na Biblioteca' e escolha a lista desejada (Lendo, Quero Ler, Concluído). Se tiver mais dúvidas, é só perguntar!")
                .likes(7).isBestAnswer(true).build();

        suporte.getReplies().add(suporteReply);

        forumTopicRepository.saveAll(List.of(regras, onePiece, recomendacao, teoria, suporte));

        log.info("✓ 5 tópicos de fórum de demonstração criados.");
    }


    private void seedTags() {
        if (tagRepository.count() > 0) {
            log.info("Tags já existem — seed de tags ignorado.");

            return;
        }

        var tags = List.of(
                Tag.builder().label("Ação").build(),
                Tag.builder().label("Aventura").build(),
                Tag.builder().label("Comédia").build(),
                Tag.builder().label("Drama").build(),
                Tag.builder().label("Fantasia").build(),
                Tag.builder().label("Ficção Científica").build(),
                Tag.builder().label("Horror").build(),
                Tag.builder().label("Mistério").build(),
                Tag.builder().label("Romance").build(),
                Tag.builder().label("Seinen").build(),
                Tag.builder().label("Shoujo").build(),
                Tag.builder().label("Shounen").build(),
                Tag.builder().label("Slice of Life").build(),
                Tag.builder().label("Sobrenatural").build(),
                Tag.builder().label("Suspense").build(),
                Tag.builder().label("Esportes").build(),
                Tag.builder().label("Artes Marciais").build(),
                Tag.builder().label("Histórico").build(),
                Tag.builder().label("Culinária").build(),
                Tag.builder().label("Urbano").build(),
                Tag.builder().label("RPG").build(),
                Tag.builder().label("Escolar").build(),
                Tag.builder().label("Mecha").build(),
                Tag.builder().label("Musical").build()
        );

        tagRepository.saveAll(tags);

        log.info("✓ {} tags de demonstração criadas.", tags.size());
    }

    private void seedStores() {
        if (storeRepository.count() > 0) {
            log.info("Stores já existem — seed de stores ignorado.");

            return;
        }

        var stores = List.of(
                Store.builder()
                        .name("Amazon")
                        .icon("amazon")
                        .description("Marketplace oficial com catálogo variado e entrega rápida.")
                        .website("https://amazon.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.7)
                        .features(List.of("Entrega rápida", "Prime", "Frete grátis"))
                        .build(),
                Store.builder()
                        .name("Panini")
                        .icon("panini")
                        .description("Editora parceira com lançamentos frequentes e edições exclusivas.")
                        .website("https://panini.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.5)
                        .features(List.of("Lançamentos", "Edições exclusivas"))
                        .build(),
                Store.builder()
                        .name("Livraria Cultura")
                        .description("Livraria com seção dedicada a mangás e eventos literários.")
                        .website("https://livrariacultura.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.3)
                        .features(List.of("Curadoria", "Eventos"))
                        .build(),
                Store.builder()
                        .name("JBC")
                        .icon("default")
                        .description("Editora com foco em mangás e light novels brasileiros.")
                        .website("https://editorajbc.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.6)
                        .features(List.of("Editora oficial", "Assinatura mensal"))
                        .build(),
                Store.builder()
                        .name("NewPOP")
                        .icon("default")
                        .description("Manhwas, mangás e publicações de nicho para leitores exigentes.")
                        .website("https://newpop.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.4)
                        .features(List.of("Manhwa", "Edições premium"))
                        .build(),
                Store.builder()
                        .name("Magalu")
                        .icon("default")
                        .description("Grande varejo online com preços competitivos e promoções.")
                        .website("https://magazineluiza.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.1)
                        .features(List.of("Cashback", "Parcelamento"))
                        .build(),
                Store.builder()
                        .name("Comix")
                        .icon("default")
                        .description("Loja especializada em mangás, HQs e colecionáveis.")
                        .website("https://comix.com.br")
                        .availability(StoreAvailability.PRE_ORDER)
                        .rating(4.8)
                        .features(List.of("Colecionáveis", "Pré-venda"))
                        .build(),
                Store.builder()
                        .name("Shopee")
                        .icon("default")
                        .description("Marketplace com vendedores independentes e ofertas diárias.")
                        .website("https://shopee.com.br")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(3.9)
                        .features(List.of("Frete grátis", "Cupons"))
                        .build()
        );

        storeRepository.saveAll(stores);

        log.info("✓ {} lojas de demonstração criadas.", stores.size());
    }
}
