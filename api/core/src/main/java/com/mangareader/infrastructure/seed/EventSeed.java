package com.mangareader.infrastructure.seed;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.entity.EventTicket;
import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;
import com.mangareader.infrastructure.persistence.postgres.repository.EventJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class EventSeed implements EntitySeeder {
    private final EventJpaRepository eventRepository;

    @Override
    public int getOrder() {
        return 8;
    }

    private static LocalizedString ls(String pt, String en, String es) {
        return LocalizedString.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es));
    }

    @Override
    public void seed() {
        if (eventRepository.count() > 0) {
            log.info("Eventos já existem — seed de events ignorado.");

            return;
        }

        var now = LocalDateTime.now();

        // Organizadores normalizados (BCNF-01): uma instância por organizador, reutilizada
        // entre eventos. external_id (organizerId) é único — não duplicar.
        var org1 = EventOrganizer.builder().organizerId("org-1").organizerName("AnimeCon Brasil")
                .organizerAvatar("https://i.pravatar.cc/100?img=40").organizerProfileLink("/profile/animecon")
                .organizerContact("contato@animecon.com.br").build();
        var org2 = EventOrganizer.builder().organizerId("org-2").organizerName("Panini Comics")
                .organizerAvatar("https://i.pravatar.cc/100?img=41").organizerProfileLink("/profile/panini")
                .organizerContact("eventos@panini.com.br").build();
        var org3 = EventOrganizer.builder().organizerId("org-3").organizerName("MangaReader")
                .organizerAvatar("https://i.pravatar.cc/100?img=42").organizerProfileLink("/profile/mangareader")
                .organizerContact("live@mangareader.com").build();
        var org4 = EventOrganizer.builder().organizerId("org-4").organizerName("SESC SP")
                .organizerAvatar("https://i.pravatar.cc/100?img=43").organizerProfileLink("/profile/sesc")
                .organizerContact("cultural@sescsp.org.br").build();
        var org5 = EventOrganizer.builder().organizerId("org-5").organizerName("Comunidade MangaReader RJ")
                .organizerAvatar("https://i.pravatar.cc/100?img=44").organizerProfileLink("/profile/mangareader-rj")
                .organizerContact("rj@mangareader.com").build();
        var org6 = EventOrganizer.builder().organizerId("org-6").organizerName("Manga Fest")
                .organizerAvatar("https://i.pravatar.cc/100?img=45").organizerProfileLink("/profile/mangafest")
                .organizerContact("contato@mangafest.com.br").build();
        var org7 = EventOrganizer.builder().organizerId("org-7").organizerName("Scanlation Brasil")
                .organizerAvatar("https://i.pravatar.cc/100?img=46").organizerProfileLink("/profile/scanlation-br")
                .organizerContact("contato@scanlationbr.com").build();

        var animeCon = Event.builder()
                .title(ls("AnimeCon SP 2026", "AnimeCon SP 2026", "AnimeCon SP 2026"))
                .subtitle(ls(
                        "O maior evento de anime e mangá do Brasil",
                        "Brazil's largest anime and manga event",
                        "El mayor evento de anime y manga de Brasil"))
                .description(ls(
                        "A AnimeCon SP reúne milhares de fãs para celebrar a cultura otaku com painéis, cosplay, artistas convidados e lançamentos exclusivos.",
                        "AnimeCon SP brings together thousands of fans to celebrate otaku culture with panels, cosplay, guest artists and exclusive releases.",
                        "AnimeCon SP reúne a miles de fans para celebrar la cultura otaku con paneles, cosplay, artistas invitados y lanzamientos exclusivos."))
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
                .organizer(org1)
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

        animeCon.getTickets().addAll(List.of(
                EventTicket.builder().event(animeCon).name("Ingresso Dia Único").priceInCents(8990).available(500).build(),
                EventTicket.builder().event(animeCon).name("Passaporte 3 Dias").priceInCents(19990).available(200).build(),
                EventTicket.builder().event(animeCon).name("VIP + Meet & Greet").priceInCents(34990).available(50).build()
        ));

        var autografos = Event.builder()
                .title(ls(
                        "Noite de Autógrafos — Hiroshi Tanaka",
                        "Signing Night — Hiroshi Tanaka",
                        "Noche de Autógrafos — Hiroshi Tanaka"))
                .subtitle(ls(
                        "Sessão exclusiva com o autor de Crônicas de Polaris",
                        "Exclusive session with the author of Polaris Chronicles",
                        "Sesión exclusiva con el autor de Crónicas de Polaris"))
                .description(ls(
                        "Hiroshi Tanaka estará presente para uma sessão de autógrafos e bate-papo sobre a criação de Crônicas de Polaris.",
                        "Hiroshi Tanaka will be present for a signing session and a talk about the creation of Polaris Chronicles.",
                        "Hiroshi Tanaka estará presente para una sesión de autógrafos y charla sobre la creación de Crónicas de Polaris."))
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
                .organizer(org2)
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

        autografos.getTickets().add(
                EventTicket.builder().event(autografos).name("Acesso com livro").priceInCents(0).available(100).build()
        );

        var live = Event.builder()
                .title(ls(
                        "Live: Análise dos Lançamentos de Março",
                        "Live: March Releases Review",
                        "Live: Análisis de Lanzamientos de Marzo"))
                .subtitle(ls(
                        "Resenha ao vivo dos principais lançamentos do mês",
                        "Live review of the month's main releases",
                        "Reseña en vivo de los principales lanzamientos del mes"))
                .description(ls(
                        "Junte-se à equipe MangaReader para uma análise ao vivo dos mangás lançados em março de 2026.",
                        "Join the MangaReader team for a live review of manga released in March 2026.",
                        "Únete al equipo MangaReader para un análisis en vivo de los mangas lanzados en marzo de 2026."))
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
                .organizer(org3)
                .priceLabel("Gratuito")
                .participants(340).interested(1200).isFeatured(true)
                .build();

        var workshop = Event.builder()
                .title(ls(
                        "Workshop: Introdução ao Desenho de Mangá",
                        "Workshop: Introduction to Manga Drawing",
                        "Taller: Introducción al Dibujo de Manga"))
                .subtitle(ls(
                        "Aprenda as bases do estilo mangá com profissionais",
                        "Learn the basics of manga style with professionals",
                        "Aprende las bases del estilo manga con profesionales"))
                .description(ls(
                        "Workshop prático para iniciantes que querem aprender a desenhar no estilo mangá.",
                        "Hands-on workshop for beginners who want to learn to draw in manga style.",
                        "Taller práctico para principiantes que quieren aprender a dibujar en estilo manga."))
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
                .organizer(org4)
                .priceLabel("R$ 25,00")
                .participants(60).interested(200)
                .build();

        var meetup = Event.builder()
                .title(ls(
                        "Meetup Leitores MangaReader — Rio de Janeiro",
                        "MangaReader Readers Meetup — Rio de Janeiro",
                        "Meetup Lectores MangaReader — Río de Janeiro"))
                .subtitle(ls(
                        "Encontro informal de leitores no Rio",
                        "Informal readers' gathering in Rio",
                        "Encuentro informal de lectores en Río"))
                .description(ls(
                        "Encontro presencial para leitores da comunidade MangaReader. Traga seus volumes favoritos para trocar e discutir!",
                        "In-person gathering for MangaReader community readers. Bring your favorite volumes to swap and discuss!",
                        "Encuentro presencial para lectores de la comunidad MangaReader. ¡Trae tus volúmenes favoritos para intercambiar y discutir!"))
                .image("https://picsum.photos/1200/600?random=507")
                .startDate(now.plusDays(14))
                .endDate(now.plusDays(14).plusHours(4))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.REGISTRATIONS_OPEN)
                .type(EventType.MEETUP)
                .location(EventLocation.builder()
                        .label("Café Otaku").address("Rua da Glória, 322")
                        .city("Rio de Janeiro").isOnline(false)
                        .mapLink("https://maps.google.com/?q=Cafe+Otaku+RJ").build())
                .organizer(org5)
                .priceLabel("Gratuito")
                .participants(25).interested(80)
                .build();

        var liveOnline = Event.builder()
                .title(ls(
                        "Live: Debate — Melhores Manhwas de Ação",
                        "Live: Debate — Best Action Manhwa",
                        "Live: Debate — Mejores Manhwas de Acción"))
                .subtitle(ls(
                        "Discussão ao vivo sobre os top manhwas de 2025-2026",
                        "Live discussion about the top manhwa of 2025-2026",
                        "Discusión en vivo sobre los mejores manhwas de 2025-2026"))
                .description(ls(
                        "Junte-se para debater os melhores manhwas de ação dos últimos dois anos.",
                        "Join in to debate the best action manhwa of the last two years.",
                        "Únete para debatir los mejores manhwas de acción de los últimos dos años."))
                .image("https://picsum.photos/1200/600?random=508")
                .startDate(now.plusDays(7))
                .endDate(now.plusDays(7).plusHours(2))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.COMING_SOON)
                .type(EventType.LIVE)
                .location(EventLocation.builder()
                        .label("Discord MangaReader").address("Online")
                        .city("Online").isOnline(true)
                        .mapLink("https://discord.gg/mangareader").build())
                .organizer(org3)
                .priceLabel("Gratuito")
                .participants(0).interested(450).isFeatured(true)
                .build();

        var convencaoPassada = Event.builder()
                .title(ls("Manga Fest BH 2025", "Manga Fest BH 2025", "Manga Fest BH 2025"))
                .subtitle(ls(
                        "Festival de mangá e cultura japonesa",
                        "Manga and Japanese culture festival",
                        "Festival de manga y cultura japonesa"))
                .description(ls(
                        "Edição 2025 do Manga Fest em Belo Horizonte com expositores, artistas e cosplay.",
                        "2025 edition of Manga Fest in Belo Horizonte with exhibitors, artists and cosplay.",
                        "Edición 2025 de Manga Fest en Belo Horizonte con expositores, artistas y cosplay."))
                .image("https://picsum.photos/1200/600?random=509")
                .startDate(now.minusDays(60))
                .endDate(now.minusDays(58))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.PAST)
                .status(EventStatus.ENDED)
                .type(EventType.CONVENCAO)
                .location(EventLocation.builder()
                        .label("Expominas").address("Av. Amazonas, 6200")
                        .city("Belo Horizonte").isOnline(false)
                        .mapLink("https://maps.google.com/?q=Expominas+BH").build())
                .organizer(org6)
                .priceLabel("R$ 60,00")
                .participants(800).interested(2500)
                .schedule(List.of(
                        "09:00 - Abertura",
                        "10:00 - Painel: Mangás de Horror",
                        "14:00 - Cosplay Championship",
                        "18:00 - Encerramento"
                ))
                .build();

        convencaoPassada.getTickets().addAll(List.of(
                EventTicket.builder().event(convencaoPassada).name("Ingresso Unitário").priceInCents(6000).available(0).build(),
                EventTicket.builder().event(convencaoPassada).name("Passaporte Completo").priceInCents(13000).available(0).build()
        ));

        var workshopOnline = Event.builder()
                .title(ls(
                        "Workshop Online: Colorização Digital de Mangá",
                        "Online Workshop: Digital Manga Coloring",
                        "Taller Online: Colorización Digital de Manga"))
                .subtitle(ls(
                        "Aprenda técnicas de colorização com tablet e Photoshop",
                        "Learn coloring techniques with tablet and Photoshop",
                        "Aprende técnicas de colorización con tableta y Photoshop"))
                .description(ls(
                        "Workshop prático online para artistas que querem aprender colorização digital no estilo mangá.",
                        "Hands-on online workshop for artists who want to learn digital coloring in manga style.",
                        "Taller práctico en línea para artistas que quieren aprender colorización digital en estilo manga."))
                .image("https://picsum.photos/1200/600?random=510")
                .startDate(now.plusDays(21))
                .endDate(now.plusDays(21).plusHours(3))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.UPCOMING)
                .status(EventStatus.REGISTRATIONS_OPEN)
                .type(EventType.WORKSHOP)
                .location(EventLocation.builder()
                        .label("Zoom").address("Online")
                        .city("Online").isOnline(true)
                        .mapLink("https://zoom.us/mangareader-workshop").build())
                .organizer(org3)
                .priceLabel("R$ 39,90")
                .participants(40).interested(180)
                .build();

        workshopOnline.getTickets().add(
                EventTicket.builder().event(workshopOnline).name("Acesso ao Workshop").priceInCents(3990).available(60).build()
        );

        var lancamentoOngoing = Event.builder()
                .title(ls(
                        "Lançamento: Noites Vermelhas — Vol. 1",
                        "Launch: Crimson Nights — Vol. 1",
                        "Lanzamiento: Noches Rojas — Vol. 1"))
                .subtitle(ls(
                        "Evento de lançamento do mangá de horror mais aguardado",
                        "Launch event for the most anticipated horror manga",
                        "Evento de lanzamiento del manga de horror más esperado"))
                .description(ls(
                        "Lançamento presencial com sessão de autógrafos do autor Kazuki Morimoto.",
                        "In-person launch with a signing session by author Kazuki Morimoto.",
                        "Lanzamiento presencial con sesión de autógrafos del autor Kazuki Morimoto."))
                .image("https://picsum.photos/1200/600?random=511")
                .startDate(now.minusHours(2))
                .endDate(now.plusHours(3))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.ONGOING)
                .status(EventStatus.HAPPENING_NOW)
                .type(EventType.LANCAMENTO)
                .location(EventLocation.builder()
                        .label("Livraria Saraiva — Shopping Eldorado")
                        .address("Av. Rebouças, 3970").city("São Paulo")
                        .isOnline(false).mapLink("https://maps.google.com/?q=Saraiva+Eldorado").build())
                .organizer(org2)
                .priceLabel("Gratuito")
                .participants(55).interested(300).isFeatured(true)
                .specialGuests(List.of("Kazuki Morimoto"))
                .build();

        var meetupPassado = Event.builder()
                .title(ls(
                        "Meetup Tradutores de Mangá — SP",
                        "Manga Translators Meetup — SP",
                        "Meetup Traductores de Manga — SP"))
                .subtitle(ls(
                        "Encontro da comunidade de tradutores amadores",
                        "Gathering of the amateur translators community",
                        "Encuentro de la comunidad de traductores aficionados"))
                .description(ls(
                        "Encontro para tradutores e revisores de scanlation para networking e troca de experiências.",
                        "Gathering for scanlation translators and proofreaders for networking and exchange of experiences.",
                        "Encuentro para traductores y correctores de scanlation para networking e intercambio de experiencias."))
                .image("https://picsum.photos/1200/600?random=512")
                .startDate(now.minusDays(30))
                .endDate(now.minusDays(30).plusHours(3))
                .timezone("America/Sao_Paulo")
                .timeline(EventTimeline.PAST)
                .status(EventStatus.ENDED)
                .type(EventType.MEETUP)
                .location(EventLocation.builder()
                        .label("WeWork Paulista").address("Av. Paulista, 1374")
                        .city("São Paulo").isOnline(false)
                        .mapLink("https://maps.google.com/?q=WeWork+Paulista").build())
                .organizer(org7)
                .priceLabel("Gratuito")
                .participants(35).interested(90)
                .build();

        eventRepository.saveAll(List.of(animeCon, autografos, live, workshop, meetup, liveOnline, convencaoPassada, workshopOnline, lancamentoOngoing, meetupPassado));

        log.info("✓ 10 eventos de demonstração criados.");
    }
}
