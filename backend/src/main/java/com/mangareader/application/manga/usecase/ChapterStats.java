package com.mangareader.application.manga.usecase;

/**
 * Estatística leve de capítulos por título (desnormalizada em tempo de
 * consulta) — usada para os badges de catálogo (DT-19).
 */
public record ChapterStats(long chaptersCount, String latestChapterNumber) {
    public static final ChapterStats EMPTY = new ChapterStats(0L, null);
}
