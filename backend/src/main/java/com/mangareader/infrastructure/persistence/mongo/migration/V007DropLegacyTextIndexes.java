package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.data.mongodb.core.MongoTemplate;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Mongock ChangeUnit — Etapa B (i18n) cleanup pós-Fase B.
 *
 * <p>Após V006 finalizar a renomeação `nameI18n→name` (titles) e
 * `titleI18n→title` (news), os campos passaram a ser subdocumentos
 * `LocalizedString`. O text index criado por V001 (`idx_titles_text`)
 * referenciava `name` como String — torna-se semanticamente quebrado
 * porque o atributo agora é objeto. Dropa o índice legado.
 *
 * <p>Busca textual passa a ser feita pelo adapter via regex sobre
 * `name.<locale>` em {@code TitleRepositoryAdapter#searchByName}.
 *
 * <p>Idempotente: ignora "index not found".
 */
@ChangeUnit(id = "V007-drop-legacy-text-indexes", order = "007", author = "mangareader")
public class V007DropLegacyTextIndexes {

    private final MongoTemplate mongoTemplate;

    public V007DropLegacyTextIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        dropIndexIfExists("titles", "idx_titles_text");
    }

    @RollbackExecution
    public void rollback() {
        // Sem rollback — recriar o text index seria contra a arquitetura Phase B.
        // Para reverter, restaurar V001 e voltar campo `name` para String.
    }

    private void dropIndexIfExists(String collection, String indexName) {
        try {
            mongoTemplate.indexOps(collection).dropIndex(indexName);
        } catch (Exception ignored) {
            // Idempotente — índice já removido ou nunca existiu.
        }
    }
}
