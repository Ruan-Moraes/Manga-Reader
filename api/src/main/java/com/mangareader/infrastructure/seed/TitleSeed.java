package com.mangareader.infrastructure.seed;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.infrastructure.persistence.mongo.repository.ChapterMongoRepository;
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
    private final ChapterMongoRepository chapterRepository;

    @Override
    public int getOrder() {
        return 2;
    }

    private static LocalizedString ls(String pt, String en, String es) {
        return LocalizedString.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es));
    }

    private final List<Chapter> chapters = new ArrayList<>();

    private void ch(String titleId, String number, String title, String date, String pages) {
        chapters.add(Chapter.builder()
                .titleId(titleId)
                .number(number)
                .title(LocalizedString.ofDefault(title))
                .releaseDate(date)
                .pages(pages)
                .build());
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
                        .popularity("10").ratingAverage(0.0)
                        .status("hiatus")
                        .author("Zhang Liang").artist("Zhang Liang").publisher("JBC")
                        .build()
        );

        titleRepository.saveAll(titles);

        ch("1", "1", "O Despertar da Forja", "2025-06-10", "42");
        ch("1", "2", "Sangue e Metal", "2025-06-17", "38");
        ch("1", "3", "A Guarda Real", "2025-06-24", "40");
        ch("1", "4", "Chamas Ancestrais", "2025-07-01", "36");
        ch("1", "5", "O Pacto Sombrio", "2025-07-08", "44");
        ch("1", "6", "Cerco de Araviel", "2025-07-15", "41");
        ch("1", "7", "Alvorada Carmesim", "2025-07-22", "39");
        ch("1", "8", "O Último Forjador", "2025-07-29", "45");

        ch("2", "1", "Tempo Perdido", "2025-05-01", "50");
        ch("2", "2", "Neon e Lâminas", "2025-05-08", "48");
        ch("2", "3", "O Torneio Secreto", "2025-05-15", "46");
        ch("2", "4", "Ecos do Passado", "2025-05-22", "52");
        ch("2", "5", "A Arena de Vidro", "2025-05-29", "44");
        ch("2", "6", "Alianças Frágeis", "2025-06-05", "47");

        ch("3", "1", "Pétalas Digitais", "2025-04-05", "40");
        ch("3", "2", "Código Verde", "2025-04-12", "38");
        ch("3", "3", "Raízes Cortadas", "2025-04-19", "42");
        ch("3", "4", "Firewall", "2025-04-26", "36");
        ch("3", "5", "Florescer no Caos", "2025-05-03", "44");

        ch("4", "1", "O Mapa Estelar", "2025-03-01", "46");
        ch("4", "2", "Terras Proibidas", "2025-03-08", "42");
        ch("4", "3", "O Rio de Cristal", "2025-03-15", "40");
        ch("4", "4", "Tempestade de Areia", "2025-03-22", "38");
        ch("4", "5", "O Farol Esquecido", "2025-03-29", "48");
        ch("4", "6", "Estrelas Perdidas", "2025-04-05", "45");
        ch("4", "7", "A Cidade Flutuante", "2025-04-12", "43");

        ch("5", "1", "O Primeiro Corte", "2025-02-14", "44");
        ch("5", "2", "Discípulo Relutante", "2025-02-21", "40");
        ch("5", "3", "Ventos do Norte", "2025-02-28", "42");
        ch("5", "4", "A Montanha Sagrada", "2025-03-07", "46");
        ch("5", "5", "Duelo ao Amanhecer", "2025-03-14", "48");

        ch("6", "1", "Os Portões Abertos", "2025-01-10", "50");
        ch("6", "2", "O Selo Partido", "2025-01-17", "46");
        ch("6", "3", "Caminho do Monge", "2025-01-24", "44");
        ch("6", "4", "Espíritos Errantes", "2025-01-31", "48");
        ch("6", "5", "A Espada Divina", "2025-02-07", "52");
        ch("6", "6", "Ascensão Celestial", "2025-02-14", "50");

        ch("7", "1", "A Primeira Peça", "2025-04-01", "36");
        ch("7", "2", "Cores do Coração", "2025-04-08", "34");
        ch("7", "3", "Fragmentos", "2025-04-15", "38");
        ch("7", "4", "O Restaurador", "2025-04-22", "36");

        ch("8", "1", "Linha de Código", "2025-05-10", "48");
        ch("8", "2", "Bugado", "2025-05-17", "44");
        ch("8", "3", "Firewall Humana", "2025-05-24", "46");
        ch("8", "4", "Override", "2025-05-31", "42");
        ch("8", "5", "Protocolo Ativado", "2025-06-07", "50");

        ch("9", "1", "O Primeiro Rito", "2025-08-01", "46");
        ch("9", "2", "Sangue na Lua", "2025-08-08", "42");
        ch("9", "3", "O Culto Desperta", "2025-08-15", "48");

        chapterRepository.saveAll(chapters);

        log.info("✓ {} títulos e {} capítulos de demonstração criados.",
                titles.size(), chapters.size());
    }
}
