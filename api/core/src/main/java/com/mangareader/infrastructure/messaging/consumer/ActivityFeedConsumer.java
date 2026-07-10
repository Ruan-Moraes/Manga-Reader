package com.mangareader.infrastructure.messaging.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.application.shared.event.ChapterReadEvent;
import com.mangareader.application.shared.event.ReviewPostedEvent;
import com.mangareader.application.shared.event.TitleCompletedEvent;
import com.mangareader.application.shared.event.UserFollowedEvent;
import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.domain.user.entity.ActivityEvent;
import com.mangareader.domain.user.entity.ActivityEventType;
import com.mangareader.domain.user.entity.activity.ActivityPayload;
import com.mangareader.domain.user.entity.activity.ChapterReadPayload;
import com.mangareader.domain.user.entity.activity.ReviewPostedPayload;
import com.mangareader.domain.user.entity.activity.TitleCompletedPayload;
import com.mangareader.domain.user.entity.activity.UserFollowedPayload;
import com.mangareader.shared.config.RabbitMQConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Único responsável por gravar eventos de atividade em {@code activity_events}.
 * <p>
 * Os use cases de origem (leitura de capítulo, resenha, biblioteca, follow)
 * não conhecem esta classe nem o Mongo — apenas publicam um evento tipado via
 * {@code EventPublisherPort}. Adicionar um tipo de evento novo é adicionar um
 * record de evento + um método {@code @RabbitHandler} aqui, sem alterar os
 * demais.
 */
@Component
@Profile("!test")
@RabbitListener(queues = RabbitMQConfig.QUEUE_ACTIVITY_FEED)
@RequiredArgsConstructor
@Slf4j
public class ActivityFeedConsumer {
    private final ActivityEventRepositoryPort activityEventRepository;

    @RabbitHandler
    public void handle(ChapterReadEvent event) {
        log.debug("Activity: chapter read [{}]", event);

        save(event.userId(), ActivityEventType.CHAPTER_READ, new ChapterReadPayload(
                event.titleId(), event.titleName(), event.titleCover(), event.chapterNumber()));
    }

    @RabbitHandler
    public void handle(ReviewPostedEvent event) {
        log.debug("Activity: review posted [{}]", event);

        save(event.userId(), ActivityEventType.REVIEW_POSTED, new ReviewPostedPayload(
                event.titleId(), event.titleName(), event.titleCover(), event.reviewId(), event.rating()));
    }

    @RabbitHandler
    public void handle(TitleCompletedEvent event) {
        log.debug("Activity: title completed [{}]", event);

        save(event.userId(), ActivityEventType.TITLE_COMPLETED, new TitleCompletedPayload(
                event.titleId(), event.titleName(), event.titleCover()));
    }

    @RabbitHandler
    public void handle(UserFollowedEvent event) {
        log.debug("Activity: user followed [{}]", event);

        save(event.userId(), ActivityEventType.USER_FOLLOWED, new UserFollowedPayload(
                event.targetType(), event.targetId(), event.targetName(), event.targetAvatar()));
    }

    private void save(String userId, ActivityEventType type, ActivityPayload payload) {
        activityEventRepository.save(ActivityEvent.builder()
                .userId(userId)
                .type(type)
                .payload(payload)
                .build());
    }
}
