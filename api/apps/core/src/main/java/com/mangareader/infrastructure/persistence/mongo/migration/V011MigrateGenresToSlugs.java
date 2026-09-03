package com.mangareader.infrastructure.persistence.mongo.migration;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Normaliza {@code titles.genres}: de rótulos de texto livre (pt-BR/en-US) para
 * a chave canônica (slug) do vocabulário {@code tags} (PostgreSQL).
 *
 * <p>Motivo: o gênero passa a ser um identificador estável e independente de
 * idioma, validado na escrita e resolvido por locale na leitura. Slugs espelham
 * {@code V31__tags_add_slug.sql} / {@code TagSeed}.
 *
 * <p>Valores fora do vocabulário (ex.: {@code "+18"}, {@code "Filosófico"}) são
 * descartados — {@code adult} já cobre conteúdo +18, e gêneros desconhecidos não
 * resolvem label. Idempotente: um valor que já é slug conhecido é mantido.
 */
@ChangeUnit(id = "V011-migrate-genres-to-slugs", order = "011", author = "mangareader")
public class V011MigrateGenresToSlugs {

    /** Rótulos legados (pt-BR e en-US) → slug canônico. */
    private static final Map<String, String> LABEL_TO_SLUG = Map.ofEntries(
            Map.entry("Ação", "ACTION"), Map.entry("Action", "ACTION"),
            Map.entry("Aventura", "ADVENTURE"), Map.entry("Adventure", "ADVENTURE"),
            Map.entry("Comédia", "COMEDY"), Map.entry("Comedy", "COMEDY"),
            Map.entry("Drama", "DRAMA"),
            Map.entry("Fantasia", "FANTASY"), Map.entry("Fantasy", "FANTASY"),
            Map.entry("Ficção Científica", "SCIENCE_FICTION"), Map.entry("Science Fiction", "SCIENCE_FICTION"),
            Map.entry("Horror", "HORROR"),
            Map.entry("Mistério", "MYSTERY"), Map.entry("Mystery", "MYSTERY"),
            Map.entry("Romance", "ROMANCE"),
            Map.entry("Seinen", "SEINEN"),
            Map.entry("Shoujo", "SHOUJO"),
            Map.entry("Shounen", "SHOUNEN"),
            Map.entry("Slice of Life", "SLICE_OF_LIFE"),
            Map.entry("Sobrenatural", "SUPERNATURAL"), Map.entry("Supernatural", "SUPERNATURAL"),
            Map.entry("Suspense", "THRILLER"), Map.entry("Thriller", "THRILLER"),
            Map.entry("Esportes", "SPORTS"), Map.entry("Sports", "SPORTS"),
            Map.entry("Artes Marciais", "MARTIAL_ARTS"), Map.entry("Martial Arts", "MARTIAL_ARTS"),
            Map.entry("Histórico", "HISTORICAL"), Map.entry("Historical", "HISTORICAL"),
            Map.entry("Culinária", "CULINARY"), Map.entry("Culinary", "CULINARY"),
            Map.entry("Urbano", "URBAN"), Map.entry("Urban", "URBAN"),
            Map.entry("RPG", "RPG"),
            Map.entry("Escolar", "SCHOOL"), Map.entry("School", "SCHOOL"),
            Map.entry("Mecha", "MECHA"),
            Map.entry("Musical", "MUSICAL"));

    private final MongoTemplate mongoTemplate;

    public V011MigrateGenresToSlugs(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var collection = mongoTemplate.getCollection("titles");

        for (Document title : collection.find()) {
            Object raw = title.get("genres");
            if (!(raw instanceof List<?> genres)) {
                continue;
            }

            List<String> mapped = new ArrayList<>();
            for (Object g : genres) {
                String value = String.valueOf(g);
                String slug = LABEL_TO_SLUG.get(value);
                if (slug == null && LABEL_TO_SLUG.containsValue(value)) {
                    slug = value; // já está no formato slug (idempotência)
                }
                if (slug != null && !mapped.contains(slug)) {
                    mapped.add(slug);
                }
            }

            collection.updateOne(
                    new Document("_id", title.get("_id")),
                    new Document("$set", new Document("genres", mapped)));
        }
    }

    @RollbackExecution
    public void rollback() {
        // Não suportado — rótulos legados não são reconstruíveis sem snapshot.
    }
}
