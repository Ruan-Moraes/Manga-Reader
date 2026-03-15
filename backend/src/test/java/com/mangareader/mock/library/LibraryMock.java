package com.mangareader.mock.library;

import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.mock.title.TitleMock;
import com.mangareader.mock.user.UserMock;

import java.util.List;
import java.util.UUID;

public final class LibraryMock {

    private LibraryMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final UUID SAVED_1_ID = UUID.fromString("40000000-0000-0000-0000-000000000001");
    public static final UUID SAVED_2_ID = UUID.fromString("40000000-0000-0000-0000-000000000002");
    public static final UUID SAVED_3_ID = UUID.fromString("40000000-0000-0000-0000-000000000003");
    public static final UUID SAVED_4_ID = UUID.fromString("40000000-0000-0000-0000-000000000004");
    public static final UUID SAVED_5_ID = UUID.fromString("40000000-0000-0000-0000-000000000005");

    // ── Single entities ────────────────────────────────────────────────────

    public static SavedManga reading() {
        return SavedManga.builder()
                .id(SAVED_1_ID)
                .user(UserMock.reader())
                .titleId(TitleMock.TITLE_1_ID)
                .name("Reino de Aco")
                .cover("https://picsum.photos/300/450?random=101")
                .type("Manga")
                .list(ReadingListType.LENDO)
                .build();
    }

    public static SavedManga wantToRead() {
        return SavedManga.builder()
                .id(SAVED_2_ID)
                .user(UserMock.reader())
                .titleId(TitleMock.TITLE_2_ID)
                .name("Lamina do Amanha")
                .cover("https://picsum.photos/300/450?random=102")
                .type("Manhwa")
                .list(ReadingListType.QUERO_LER)
                .build();
    }

    public static SavedManga completed() {
        return SavedManga.builder()
                .id(SAVED_3_ID)
                .user(UserMock.reader())
                .titleId(TitleMock.TITLE_4_ID)
                .name("Cronicas de Polaris")
                .cover("https://picsum.photos/300/450?random=104")
                .type("Manga")
                .list(ReadingListType.CONCLUIDO)
                .build();
    }

    public static SavedManga anotherUserReading() {
        return SavedManga.builder()
                .id(SAVED_4_ID)
                .user(UserMock.moderator())
                .titleId(TitleMock.TITLE_3_ID)
                .name("Flores de Neon")
                .cover("https://picsum.photos/300/450?random=103")
                .type("Manhua")
                .list(ReadingListType.LENDO)
                .build();
    }

    public static SavedManga adminCompleted() {
        return SavedManga.builder()
                .id(SAVED_5_ID)
                .user(UserMock.admin())
                .titleId(TitleMock.TITLE_8_ID)
                .name("Protocolo Zero")
                .cover("https://picsum.photos/300/450?random=108")
                .type("Manga")
                .list(ReadingListType.CONCLUIDO)
                .build();
    }

    public static SavedManga forUser(User user, String titleId, String name, ReadingListType list) {
        return SavedManga.builder()
                .id(UUID.randomUUID())
                .user(user)
                .titleId(titleId)
                .name(name)
                .cover("https://picsum.photos/300/450?random=" + titleId.hashCode())
                .type("Manga")
                .list(list)
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<SavedManga> readerLibrary() {
        return List.of(reading(), wantToRead(), completed());
    }

    public static List<SavedManga> allSaved() {
        return List.of(reading(), wantToRead(), completed(), anotherUserReading(), adminCompleted());
    }

    public static List<SavedManga> byList(ReadingListType list) {
        return allSaved().stream()
                .filter(s -> s.getList() == list)
                .toList();
    }
}
