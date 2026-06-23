package com.mangareader.reconciler.infrastructure.crossdb;

import static java.util.stream.Collectors.joining;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Remove linhas órfãs das tabelas Postgres que referenciam um título do Mongo via
 * {@code title_id} (ref cross-DB, sem FK física). Rede de segurança para o caso de
 * um título ser apagado do Mongo sem passar pela limpeza síncrona do use case.
 * <p>
 * Estratégia idempotente: coleta os {@code title_id} distintos das tabelas de ref,
 * confere quais ainda existem em {@code titles} (batch {@code $in}, tratando
 * {@code _id} ObjectId <i>ou</i> String — seeds/UUIDs migrados) e apaga, em batch,
 * as linhas cujo título não existe mais.
 * <p>
 * <b>Guard anti-wipe:</b> se há refs mas o Mongo não devolve <i>nenhum</i> título
 * existente, aborta sem apagar nada — bem mais provável uma falha de conexão do que
 * 100% de órfãos reais.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrphanTitleRefReconciler {
    /** Tabelas Postgres com ref cross-DB {@code title_id} (sem FK física). */
    static final List<String> TITLE_REF_TABLES = List.of(
            "user_libraries", "group_works", "store_titles", "title_authors", "title_publishers");

    private static final String TITLES_COLLECTION = "titles";

    /** Tamanho dos lotes de {@code $in} / {@code IN (...)} para não estourar limites. */
    private static final int CHUNK = 1000;

    private final JdbcTemplate jdbcTemplate;
    private final MongoTemplate mongoTemplate;

    /**
     * Reconcilia as referências órfãs de todas as tabelas.
     *
     * @return mapa {@code tabela -> linhas removidas} (sempre com as 5 chaves).
     */
    public Map<String, Integer> reconcile() {
        Set<String> referenced = collectReferencedTitleIds();
        if (referenced.isEmpty()) {
            return emptyResult();
        }

        Set<String> existing = findExistingInMongo(referenced);

        // Guard anti-wipe: havia refs mas o Mongo não achou nenhum título.
        if (existing.isEmpty()) {
            log.warn("Limpeza de órfãos abortada: {} title_id referenciados, 0 encontrados em '{}' "
                    + "(provável falha de conexão). Nenhuma linha removida.", referenced.size(), TITLES_COLLECTION);

            return emptyResult();
        }

        Set<String> orphans = new HashSet<>(referenced);
        orphans.removeAll(existing);
        if (orphans.isEmpty()) {
            return emptyResult();
        }

        return deleteOrphans(new ArrayList<>(orphans));
    }

    /** {@code SELECT DISTINCT title_id} de cada tabela, unidos num único conjunto. */
    private Set<String> collectReferencedTitleIds() {
        Set<String> ids = new HashSet<>();

        for (String table : TITLE_REF_TABLES) {
            jdbcTemplate.queryForList("SELECT DISTINCT title_id FROM " + table, String.class)
                    .forEach(id -> {
                        if (id != null && !id.isBlank()) ids.add(id);
                    });
        }

        return ids;
    }

    /**
     * Conjunto dos {@code title_id} (na forma String referenciada) que ainda existem
     * em {@code titles}. Consulta o {@code _id} nas duas formas (String e ObjectId)
     * e normaliza o resultado de volta para String.
     */
    private Set<String> findExistingInMongo(Set<String> referenced) {
        Set<String> existing = new HashSet<>();
        List<String> all = new ArrayList<>(referenced);

        for (int i = 0; i < all.size(); i += CHUNK) {
            List<String> chunk = all.subList(i, Math.min(i + CHUNK, all.size()));
            List<Object> idsToQuery = new ArrayList<>(chunk.size() * 2);

            for (String id : chunk) {
                idsToQuery.add(id);
                if (ObjectId.isValid(id)) idsToQuery.add(new ObjectId(id));
            }

            mongoTemplate.getCollection(TITLES_COLLECTION)
                    .find(new Document("_id", new Document("$in", idsToQuery)))
                    .projection(new Document("_id", 1))
                    .forEach(doc -> existing.add(stringifyId(doc.get("_id"))));
        }

        return existing;
    }

    /** Apaga, por tabela e em lotes, as linhas dos {@code title_id} órfãos. */
    private Map<String, Integer> deleteOrphans(List<String> orphans) {
        Map<String, Integer> removed = new LinkedHashMap<>();

        for (String table : TITLE_REF_TABLES) {
            int count = 0;

            for (int i = 0; i < orphans.size(); i += CHUNK) {
                List<String> chunk = orphans.subList(i, Math.min(i + CHUNK, orphans.size()));
                String placeholders = chunk.stream().map(x -> "?").collect(joining(","));

                count += jdbcTemplate.update(
                        "DELETE FROM " + table + " WHERE title_id IN (" + placeholders + ")", chunk.toArray());
            }

            removed.put(table, count);
        }

        return removed;
    }

    /** {@code _id} pode ser ObjectId (app) ou String (seed/UUID); normaliza para String. */
    private static String stringifyId(Object id) {
        return id instanceof ObjectId oid ? oid.toHexString() : String.valueOf(id);
    }

    private static Map<String, Integer> emptyResult() {
        Map<String, Integer> result = new LinkedHashMap<>();
        TITLE_REF_TABLES.forEach(table -> result.put(table, 0));

        return result;
    }
}
