package com.mangareader.aggregator.infrastructure.migration;

import java.util.List;

import org.springframework.data.mongodb.core.MongoTemplate;

import com.mangareader.aggregator.application.RecalculateTitleRatingUseCase;
import com.mangareader.aggregator.domain.TitleRatingAggregate;
import com.mangareader.aggregator.infrastructure.repository.RatingAggregationDao;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;

/**
 * Mongock ChangeUnit — cria a coleção {@code title_rating_aggregate} e faz
 * backfill a partir das resenhas existentes em {@code reviews}.
 * <p>
 * Resolve o cold-start: títulos já avaliados passam a exibir a nota correta
 * imediatamente, sem depender de um evento futuro. Idempotente — recomputa o
 * agregado de cada título avaliado (upsert por {@code _id = titleId}).
 * <p>
 * Delega ao {@link RecalculateTitleRatingUseCase} (mesma pipeline dos eventos e
 * do job de reconciliação) — uma única implementação da agregação no serviço.
 */
@Slf4j
@ChangeUnit(id = "V001-create-title-rating-aggregate", order = "001", author = "mangareader")
public class V001CreateTitleRatingAggregate {
    private final MongoTemplate mongoTemplate;
    private final RatingAggregationDao ratingAggregationDao;
    private final RecalculateTitleRatingUseCase recalculateTitleRating;

    public V001CreateTitleRatingAggregate(
            MongoTemplate mongoTemplate,
            RatingAggregationDao ratingAggregationDao,
            RecalculateTitleRatingUseCase recalculateTitleRating) {
        this.mongoTemplate = mongoTemplate;
        this.ratingAggregationDao = ratingAggregationDao;
        this.recalculateTitleRating = recalculateTitleRating;
    }

    @Execution
    public void execute() {
        List<String> titleIds = ratingAggregationDao.distinctRatedTitleIds();

        log.info("V001 início — backfill de title_rating_aggregate para {} títulos", titleIds.size());

        titleIds.forEach(recalculateTitleRating::execute);

        log.info("V001 fim — {} agregados gravados", titleIds.size());
    }

    @RollbackExecution
    public void rollback() {
        mongoTemplate.dropCollection(TitleRatingAggregate.class);
    }
}
