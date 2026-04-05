package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.infrastructure.persistence.postgres.repository.LibraryJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class LibrarySeed implements EntitySeeder {
    private final LibraryJpaRepository libraryRepository;
    private final UserJpaRepository userRepository;

    @Override
    public int getOrder() {
        return 5;
    }

    @Override
    public void seed() {
        if (libraryRepository.count() > 0) {
            log.info("Biblioteca já existe — seed de library ignorado.");

            return;
        }

        var users = userRepository.findAll();

        if (users.isEmpty()) return;

        var demoUser = users.get(0);
        var mika = users.get(1);

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
}
