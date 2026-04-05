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

        eventRepository.saveAll(List.of(animeCon, autografos, live, workshop));

        log.info("✓ 4 eventos de demonstração criados.");
    }
}
