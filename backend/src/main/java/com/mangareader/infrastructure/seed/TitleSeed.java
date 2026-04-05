package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.infrastructure.persistence.mongo.repository.TitleMongoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class TitleSeed implements EntitySeeder {
    private final TitleMongoRepository titleRepository;

    @Override
    public int getOrder() {
        return 2;
    }

    @Override
    public void seed() {
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
                        .popularity("98").ratingAverage(3.0)
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
                        .popularity("94").ratingAverage(2.9)
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
                        .popularity("87").ratingAverage(1.5)
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
                        .popularity("91").ratingAverage(3.7)
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
                        .popularity("89").ratingAverage(2.6)
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
                        .popularity("92").ratingAverage(1.8)
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
                        .popularity("85").ratingAverage(0.3)
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
                        .popularity("90").ratingAverage(2.8)
                        .author("Park Min-Ho").artist("Park Min-Ho").publisher("NewPOP")
                        .build()
        );

        titleRepository.saveAll(titles);

        log.info("✓ {} títulos de demonstração criados.", titles.size());
    }
}
