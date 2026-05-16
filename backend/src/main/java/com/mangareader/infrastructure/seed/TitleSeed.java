package com.mangareader.infrastructure.seed;

import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.infrastructure.persistence.mongo.repository.TitleMongoRepository;
import com.mangareader.shared.domain.i18n.LocalizedString;

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

    private static LocalizedString ls(String pt, String en, String es) {
        return LocalizedString.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es));
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
                        .name(ls("Reino de Aço", "Kingdom of Steel", "Reino de Acero"))
                        .cover("https://picsum.photos/300/450?random=101")
                        .synopsis(ls(
                                "Em um mundo onde armaduras vivas dominam os campos de batalha, um ferreiro órfão descobre que seu sangue pode despertar a lendária Armadura Negra.",
                                "In a world where living armors rule the battlefields, an orphan blacksmith discovers his blood can awaken the legendary Black Armor.",
                                "En un mundo donde armaduras vivientes dominan los campos de batalla, un herrero huérfano descubre que su sangre puede despertar la legendaria Armadura Negra."))
                        .genres(List.of("Ação", "Fantasia", "Aventura"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title(LocalizedString.ofDefault("O Despertar da Forja")).releaseDate("2025-06-10").pages("42").build(),
                                Chapter.builder().number("2").title(LocalizedString.ofDefault("Sangue e Metal")).releaseDate("2025-06-17").pages("38").build(),
                                Chapter.builder().number("3").title(LocalizedString.ofDefault("A Guarda Real")).releaseDate("2025-06-24").pages("40").build(),
                                Chapter.builder().number("4").title(LocalizedString.ofDefault("Chamas Ancestrais")).releaseDate("2025-07-01").pages("36").build(),
                                Chapter.builder().number("5").title(LocalizedString.ofDefault("O Pacto Sombrio")).releaseDate("2025-07-08").pages("44").build(),
                                Chapter.builder().number("6").title(LocalizedString.ofDefault("Cerco de Araviel")).releaseDate("2025-07-15").pages("41").build(),
                                Chapter.builder().number("7").title(LocalizedString.ofDefault("Alvorada Carmesim")).releaseDate("2025-07-22").pages("39").build(),
                                Chapter.builder().number("8").title(LocalizedString.ofDefault("O Último Forjador")).releaseDate("2025-07-29").pages("45").build()
                        ))
                        .popularity("98").ratingAverage(3.0)
                        .author("Takeshi Yamamoto").artist("Takeshi Yamamoto").publisher("Panini")
                        .build(),

                Title.builder()
                        .id("2")
                        .type("Manhwa")
                        .name(ls("Lâmina do Amanhã", "Blade of Tomorrow", "Hoja del Mañana"))
                        .cover("https://picsum.photos/300/450?random=102")
                        .synopsis(ls(
                                "Após acordar 500 anos no futuro, um espadachim medieval precisa dominar tecnologia avançada para sobreviver em uma sociedade que erradicou a violência.",
                                "After waking 500 years in the future, a medieval swordsman must master advanced technology to survive in a society that eradicated violence.",
                                "Tras despertar 500 años en el futuro, un espadachín medieval debe dominar tecnología avanzada para sobrevivir en una sociedad que erradicó la violencia."))
                        .genres(List.of("Ação", "Ficção Científica", "Drama"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title(LocalizedString.ofDefault("Tempo Perdido")).releaseDate("2025-05-01").pages("50").build(),
                                Chapter.builder().number("2").title(LocalizedString.ofDefault("Neon e Lâminas")).releaseDate("2025-05-08").pages("48").build(),
                                Chapter.builder().number("3").title(LocalizedString.ofDefault("O Torneio Secreto")).releaseDate("2025-05-15").pages("46").build(),
                                Chapter.builder().number("4").title(LocalizedString.ofDefault("Ecos do Passado")).releaseDate("2025-05-22").pages("52").build(),
                                Chapter.builder().number("5").title(LocalizedString.ofDefault("A Arena de Vidro")).releaseDate("2025-05-29").pages("44").build(),
                                Chapter.builder().number("6").title(LocalizedString.ofDefault("Alianças Frágeis")).releaseDate("2025-06-05").pages("47").build()
                        ))
                        .popularity("94").ratingAverage(2.9)
                        .author("Park Ji-Won").artist("Lee Soo-Hyun").publisher("NewPOP")
                        .build(),

                Title.builder()
                        .id("3")
                        .type("Mangá")
                        .name(ls("Flores de Neon", "Neon Flowers", "Flores de Neón"))
                        .cover("https://picsum.photos/300/450?random=103")
                        .synopsis(ls(
                                "Em Tóquio, uma florista de dia e hacker de noite se vê envolvida em uma conspiração corporativa quando suas duas vidas colidem.",
                                "In Tokyo, a florist by day and hacker by night gets entangled in a corporate conspiracy when her two lives collide.",
                                "En Tokio, una florista de día y hacker de noche se ve envuelta en una conspiración corporativa cuando sus dos vidas colisionan."))
                        .genres(List.of("Suspense", "Seinen", "Urbano"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title(LocalizedString.ofDefault("Pétalas Digitais")).releaseDate("2025-04-05").pages("40").build(),
                                Chapter.builder().number("2").title(LocalizedString.ofDefault("Código Verde")).releaseDate("2025-04-12").pages("38").build(),
                                Chapter.builder().number("3").title(LocalizedString.ofDefault("Raízes Cortadas")).releaseDate("2025-04-19").pages("42").build(),
                                Chapter.builder().number("4").title(LocalizedString.ofDefault("Firewall")).releaseDate("2025-04-26").pages("36").build(),
                                Chapter.builder().number("5").title(LocalizedString.ofDefault("Florescer no Caos")).releaseDate("2025-05-03").pages("44").build()
                        ))
                        .popularity("87").ratingAverage(1.5)
                        .author("Yuki Aoi").artist("Yuki Aoi").publisher("JBC")
                        .build(),

                Title.builder()
                        .id("4")
                        .type("Mangá")
                        .name(ls("Crônicas de Polaris", "Polaris Chronicles", "Crónicas de Polaris"))
                        .cover("https://picsum.photos/300/450?random=104")
                        .synopsis(ls(
                                "Um grupo de exploradores parte rumo à estrela Polaris seguindo mapas antigos que prometem revelar a origem da humanidade.",
                                "A group of explorers sets out toward the star Polaris following ancient maps that promise to reveal humanity's origin.",
                                "Un grupo de exploradores parte hacia la estrella Polaris siguiendo mapas antiguos que prometen revelar el origen de la humanidad."))
                        .genres(List.of("Aventura", "Fantasia", "Histórico"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title(LocalizedString.ofDefault("O Mapa Estelar")).releaseDate("2025-03-01").pages("46").build(),
                                Chapter.builder().number("2").title(LocalizedString.ofDefault("Terras Proibidas")).releaseDate("2025-03-08").pages("42").build(),
                                Chapter.builder().number("3").title(LocalizedString.ofDefault("O Rio de Cristal")).releaseDate("2025-03-15").pages("40").build(),
                                Chapter.builder().number("4").title(LocalizedString.ofDefault("Tempestade de Areia")).releaseDate("2025-03-22").pages("38").build(),
                                Chapter.builder().number("5").title(LocalizedString.ofDefault("O Farol Esquecido")).releaseDate("2025-03-29").pages("48").build(),
                                Chapter.builder().number("6").title(LocalizedString.ofDefault("Estrelas Perdidas")).releaseDate("2025-04-05").pages("45").build(),
                                Chapter.builder().number("7").title(LocalizedString.ofDefault("A Cidade Flutuante")).releaseDate("2025-04-12").pages("43").build()
                        ))
                        .popularity("91").ratingAverage(3.7)
                        .author("Hiroshi Tanaka").artist("Hiroshi Tanaka").publisher("Panini")
                        .build(),

                Title.builder()
                        .id("5")
                        .type("Manhwa")
                        .name(ls("Vento Cortante", "Cutting Wind", "Viento Cortante"))
                        .cover("https://picsum.photos/300/450?random=105")
                        .synopsis(ls(
                                "Um jovem artista marcial descobre que possui a habilidade rara de cortar o vento, tornando-se alvo de clãs rivais que desejam dominar essa técnica lendária.",
                                "A young martial artist discovers he has the rare ability to cut the wind, becoming the target of rival clans seeking to master this legendary technique.",
                                "Un joven artista marcial descubre que posee la rara habilidad de cortar el viento, convirtiéndose en blanco de clanes rivales que desean dominar esta técnica legendaria."))
                        .genres(List.of("Ação", "Artes Marciais", "Drama"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title(LocalizedString.ofDefault("O Primeiro Corte")).releaseDate("2025-02-14").pages("44").build(),
                                Chapter.builder().number("2").title(LocalizedString.ofDefault("Discípulo Relutante")).releaseDate("2025-02-21").pages("40").build(),
                                Chapter.builder().number("3").title(LocalizedString.ofDefault("Ventos do Norte")).releaseDate("2025-02-28").pages("42").build(),
                                Chapter.builder().number("4").title(LocalizedString.ofDefault("A Montanha Sagrada")).releaseDate("2025-03-07").pages("46").build(),
                                Chapter.builder().number("5").title(LocalizedString.ofDefault("Duelo ao Amanhecer")).releaseDate("2025-03-14").pages("48").build()
                        ))
                        .popularity("89").ratingAverage(2.6)
                        .author("Kim Dae-Sung").artist("Kim Dae-Sung").publisher("NewPOP")
                        .build(),

                Title.builder()
                        .id("6")
                        .type("Manhua")
                        .name(ls("Guardião Celestial", "Celestial Guardian", "Guardián Celestial"))
                        .cover("https://picsum.photos/300/450?random=106")
                        .synopsis(ls(
                                "Quando os portões celestiais se abrem, um jovem monge é escolhido como o último guardião entre o mundo mortal e o reino dos deuses.",
                                "When the celestial gates open, a young monk is chosen as the last guardian between the mortal world and the realm of gods.",
                                "Cuando se abren las puertas celestiales, un joven monje es elegido como el último guardián entre el mundo mortal y el reino de los dioses."))
                        .genres(List.of("Fantasia", "Sobrenatural", "Aventura"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title(LocalizedString.ofDefault("Os Portões Abertos")).releaseDate("2025-01-10").pages("50").build(),
                                Chapter.builder().number("2").title(LocalizedString.ofDefault("O Selo Partido")).releaseDate("2025-01-17").pages("46").build(),
                                Chapter.builder().number("3").title(LocalizedString.ofDefault("Caminho do Monge")).releaseDate("2025-01-24").pages("44").build(),
                                Chapter.builder().number("4").title(LocalizedString.ofDefault("Espíritos Errantes")).releaseDate("2025-01-31").pages("48").build(),
                                Chapter.builder().number("5").title(LocalizedString.ofDefault("A Espada Divina")).releaseDate("2025-02-07").pages("52").build(),
                                Chapter.builder().number("6").title(LocalizedString.ofDefault("Ascensão Celestial")).releaseDate("2025-02-14").pages("50").build()
                        ))
                        .popularity("92").ratingAverage(1.8)
                        .author("Chen Wei").artist("Liu Xing").publisher("Panini")
                        .build(),

                Title.builder()
                        .id("7")
                        .type("Mangá")
                        .name(ls("Coração de Porcelana", "Porcelain Heart", "Corazón de Porcelana"))
                        .cover("https://picsum.photos/300/450?random=107")
                        .synopsis(ls(
                                "Uma jovem artesã de porcelana descobre que suas criações ganham vida própria, revelando sentimentos que ela há muito tempo tentava esconder.",
                                "A young porcelain artisan discovers her creations come to life, revealing feelings she had long tried to hide.",
                                "Una joven artesana de porcelana descubre que sus creaciones cobran vida propia, revelando sentimientos que ella intentaba ocultar desde hace mucho."))
                        .genres(List.of("Romance", "Shoujo", "Slice of Life"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title(LocalizedString.ofDefault("A Primeira Peça")).releaseDate("2025-04-01").pages("36").build(),
                                Chapter.builder().number("2").title(LocalizedString.ofDefault("Cores do Coração")).releaseDate("2025-04-08").pages("34").build(),
                                Chapter.builder().number("3").title(LocalizedString.ofDefault("Fragmentos")).releaseDate("2025-04-15").pages("38").build(),
                                Chapter.builder().number("4").title(LocalizedString.ofDefault("O Restaurador")).releaseDate("2025-04-22").pages("36").build()
                        ))
                        .popularity("85").ratingAverage(0.3)
                        .author("Sakura Miyazaki").artist("Sakura Miyazaki").publisher("JBC")
                        .build(),

                Title.builder()
                        .id("8")
                        .type("Manhwa")
                        .name(ls("Protocolo Zero", "Protocol Zero", "Protocolo Cero"))
                        .cover("https://picsum.photos/300/450?random=108")
                        .synopsis(ls(
                                "Em um futuro distópico, um programador descobre que a IA governante esconde um protocolo secreto que pode libertar ou destruir a humanidade.",
                                "In a dystopian future, a programmer discovers that the ruling AI hides a secret protocol that can either free or destroy humanity.",
                                "En un futuro distópico, un programador descubre que la IA gobernante esconde un protocolo secreto que puede liberar o destruir a la humanidad."))
                        .genres(List.of("Ficção Científica", "Thriller", "Seinen"))
                        .chapters(List.of(
                                Chapter.builder().number("1").title(LocalizedString.ofDefault("Linha de Código")).releaseDate("2025-05-10").pages("48").build(),
                                Chapter.builder().number("2").title(LocalizedString.ofDefault("Bugado")).releaseDate("2025-05-17").pages("44").build(),
                                Chapter.builder().number("3").title(LocalizedString.ofDefault("Firewall Humana")).releaseDate("2025-05-24").pages("46").build(),
                                Chapter.builder().number("4").title(LocalizedString.ofDefault("Override")).releaseDate("2025-05-31").pages("42").build(),
                                Chapter.builder().number("5").title(LocalizedString.ofDefault("Protocolo Ativado")).releaseDate("2025-06-07").pages("50").build()
                        ))
                        .popularity("90").ratingAverage(2.8)
                        .author("Park Min-Ho").artist("Park Min-Ho").publisher("NewPOP")
                        .build(),

                Title.builder()
                        .id("9")
                        .type("Mangá")
                        .name(ls("Noites Vermelhas", "Crimson Nights", "Noches Rojas"))
                        .cover("https://picsum.photos/300/450?random=109")
                        .synopsis(ls(
                                "Em uma cidade tomada por cultos sobrenaturais, um detetive desacreditado investiga desaparecimentos que levam a rituais ancestrais de sangue.",
                                "In a city overrun by supernatural cults, a discredited detective investigates disappearances that lead to ancient blood rituals.",
                                "En una ciudad dominada por cultos sobrenaturales, un detective desacreditado investiga desapariciones que llevan a rituales ancestrales de sangre."))
                        .genres(List.of("Horror", "Suspense", "Seinen", "+18"))
                        .adult(true)
                        .chapters(List.of(
                                Chapter.builder().number("1").title(LocalizedString.ofDefault("O Primeiro Rito")).releaseDate("2025-08-01").pages("46").build(),
                                Chapter.builder().number("2").title(LocalizedString.ofDefault("Sangue na Lua")).releaseDate("2025-08-08").pages("42").build(),
                                Chapter.builder().number("3").title(LocalizedString.ofDefault("O Culto Desperta")).releaseDate("2025-08-15").pages("48").build()
                        ))
                        .popularity("72").ratingAverage(4.2)
                        .status("ongoing")
                        .author("Kazuki Morimoto").artist("Kazuki Morimoto").publisher("Panini")
                        .build(),

                Title.builder()
                        .id("10")
                        .type("Manhua")
                        .name(ls("Espelho do Vazio", "Mirror of the Void", "Espejo del Vacío"))
                        .cover("https://picsum.photos/300/450?random=110")
                        .synopsis(ls(
                                "Um monge errante busca fragmentos de um espelho místico que reflete verdades ocultas, enquanto enfrenta seus próprios demônios internos.",
                                "A wandering monk searches for fragments of a mystical mirror that reflects hidden truths while confronting his own inner demons.",
                                "Un monje errante busca fragmentos de un espejo místico que refleja verdades ocultas, mientras enfrenta sus propios demonios internos."))
                        .genres(List.of("Fantasia", "Filosófico", "Aventura"))
                        .chapters(List.of())
                        .popularity("10").ratingAverage(0.0)
                        .status("hiatus")
                        .author("Zhang Liang").artist("Zhang Liang").publisher("JBC")
                        .build()
        );

        titleRepository.saveAll(titles);

        log.info("✓ {} títulos de demonstração criados.", titles.size());
    }
}
