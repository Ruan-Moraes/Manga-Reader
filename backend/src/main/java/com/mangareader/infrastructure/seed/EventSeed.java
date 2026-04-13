package com.mangareader.infrastructure.seed;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

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

    @Override
    public void seed() {
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

        animeCon.getTickets().addAll(List.of(
                EventTicket.builder().event(animeCon).name("Ingresso Dia Único").price("R$ 89,90").available(500).build(),
                EventTicket.builder().event(animeCon).name("Passaporte 3 Dias").price("R$ 199,90").available(200).build(),
                EventTicket.builder().event(animeCon).name("VIP + Meet & Greet").price("R$ 349,90").available(50).build()
        ));

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

        autografos.getTickets().add(
                EventTicket.builder().event(autografos).name("Acesso com livro").price("Gratuito").available(100).build()
        );

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

        var meetup = Event.builder()
                .title("Meetup Leitores MangaReader — Rio de Janeiro")
                .subtitle("Encontro informal de leitores no Rio")
                .description("Encontro presencial para leitores da comunidade MangaReader. Traga seus volumes favoritos para trocar e discutir!")
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
                .organizer(EventOrganizer.builder()
                        .organizerId("org-5").organizerName("Comunidade MangaReader RJ")
                        .organizerAvatar("https://i.pravatar.cc/100?img=44")
                        .organizerProfileLink("/profile/mangareader-rj")
                        .organizerContact("rj@mangareader.com").build())
                .priceLabel("Gratuito")
                .participants(25).interested(80)
                .build();

        var liveOnline = Event.builder()
                .title("Live: Debate — Melhores Manhwas de Ação")
                .subtitle("Discussão ao vivo sobre os top manhwas de 2025-2026")
                .description("Junte-se para debater os melhores manhwas de ação dos últimos dois anos.")
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
                .organizer(EventOrganizer.builder()
                        .organizerId("org-3").organizerName("MangaReader")
                        .organizerAvatar("https://i.pravatar.cc/100?img=42")
                        .organizerProfileLink("/profile/mangareader")
                        .organizerContact("live@mangareader.com").build())
                .priceLabel("Gratuito")
                .participants(0).interested(450).isFeatured(true)
                .build();

        var convencaoPassada = Event.builder()
                .title("Manga Fest BH 2025")
                .subtitle("Festival de mangá e cultura japonesa")
                .description("Edição 2025 do Manga Fest em Belo Horizonte com expositores, artistas e cosplay.")
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
                .organizer(EventOrganizer.builder()
                        .organizerId("org-6").organizerName("Manga Fest")
                        .organizerAvatar("https://i.pravatar.cc/100?img=45")
                        .organizerProfileLink("/profile/mangafest")
                        .organizerContact("contato@mangafest.com.br").build())
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
                EventTicket.builder().event(convencaoPassada).name("Ingresso Unitário").price("R$ 60,00").available(0).build(),
                EventTicket.builder().event(convencaoPassada).name("Passaporte Completo").price("R$ 130,00").available(0).build()
        ));

        var workshopOnline = Event.builder()
                .title("Workshop Online: Colorização Digital de Mangá")
                .subtitle("Aprenda técnicas de colorização com tablet e Photoshop")
                .description("Workshop prático online para artistas que querem aprender colorização digital no estilo mangá.")
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
                .organizer(EventOrganizer.builder()
                        .organizerId("org-3").organizerName("MangaReader")
                        .organizerAvatar("https://i.pravatar.cc/100?img=42")
                        .organizerProfileLink("/profile/mangareader")
                        .organizerContact("workshops@mangareader.com").build())
                .priceLabel("R$ 39,90")
                .participants(40).interested(180)
                .build();

        workshopOnline.getTickets().add(
                EventTicket.builder().event(workshopOnline).name("Acesso ao Workshop").price("R$ 39,90").available(60).build()
        );

        var lancamentoOngoing = Event.builder()
                .title("Lançamento: Noites Vermelhas — Vol. 1")
                .subtitle("Evento de lançamento do mangá de horror mais aguardado")
                .description("Lançamento presencial com sessão de autógrafos do autor Kazuki Morimoto.")
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
                .organizer(EventOrganizer.builder()
                        .organizerId("org-2").organizerName("Panini Comics")
                        .organizerAvatar("https://i.pravatar.cc/100?img=41")
                        .organizerProfileLink("/profile/panini")
                        .organizerContact("eventos@panini.com.br").build())
                .priceLabel("Gratuito")
                .participants(55).interested(300).isFeatured(true)
                .specialGuests(List.of("Kazuki Morimoto"))
                .build();

        var meetupPassado = Event.builder()
                .title("Meetup Tradutores de Mangá — SP")
                .subtitle("Encontro da comunidade de tradutores amadores")
                .description("Encontro para tradutores e revisores de scanlation para networking e troca de experiências.")
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
                .organizer(EventOrganizer.builder()
                        .organizerId("org-7").organizerName("Scanlation Brasil")
                        .organizerAvatar("https://i.pravatar.cc/100?img=46")
                        .organizerProfileLink("/profile/scanlation-br")
                        .organizerContact("contato@scanlationbr.com").build())
                .priceLabel("Gratuito")
                .participants(35).interested(90)
                .build();

        eventRepository.saveAll(List.of(animeCon, autografos, live, workshop, meetup, liveOnline, convencaoPassada, workshopOnline, lancamentoOngoing, meetupPassado));

        log.info("✓ 10 eventos de demonstração criados.");
    }
}
