package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Mongock ChangeUnit — índice em {@code news.publishedAt}.
 *
 * <p>{@code NewsItem.publishedAt} tem {@code @Indexed}, mas com
 * {@code spring.data.mongodb.auto-index-creation=false} a anotação não cria
 * índice — precisa ser criado por migration. V001 indexou category/tags/text
 * mas não publishedAt, usado para ordenação das listagens de notícias
 * (`findAllByOrderByPublishedAtDesc`, sort default admin).
 */
@ChangeUnit(id = "V008-create-news-published-at-index", order = "008", author = "mangareader")
public class V008CreateNewsPublishedAtIndex {
    private final MongoTemplate mongoTemplate;

    public V008CreateNewsPublishedAtIndex(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        mongoTemplate.indexOps("news").ensureIndex(
                new Index().on("publishedAt", Sort.Direction.DESC)
                        .named("idx_news_publishedAt"));
    }

    @RollbackExecution
    public void rollback() {
        try {
            mongoTemplate.indexOps("news").dropIndex("idx_news_publishedAt");
        } catch (DataAccessException ignored) {
            // Idempotente — índice já removido ou nunca existiu.
        }
    }
}
