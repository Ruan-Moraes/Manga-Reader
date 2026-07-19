package com.mangareader.infrastructure.messaging.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.context.annotation.Profile;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import com.mangareader.application.shared.event.ChapterReadEvent;
import com.mangareader.application.shared.event.ReviewPostedEvent;
import com.mangareader.application.shared.event.TitleCompletedEvent;
import com.mangareader.application.shared.event.UserFollowedEvent;
import com.mangareader.application.user.usecase.RecordActivityEventUseCase;
import com.mangareader.domain.user.entity.ActivityEventType;
import com.mangareader.domain.user.entity.activity.ActivityPayload;
import com.mangareader.domain.user.entity.activity.ChapterReadPayload;
import com.mangareader.domain.user.entity.activity.ReviewPostedPayload;
import com.mangareader.domain.user.entity.activity.TitleCompletedPayload;
import com.mangareader.domain.user.entity.activity.UserFollowedPayload;
import com.mangareader.shared.config.RabbitMQConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Profile("!test")
@RabbitListener(queues = RabbitMQConfig.QUEUE_ACTIVITY_FEED, containerFactory = "activityRabbitListenerContainerFactory")
@RequiredArgsConstructor
@Slf4j
public class ActivityFeedConsumer {
    private final RecordActivityEventUseCase recordActivityEventUseCase;

    @RabbitHandler
    public void handle(ChapterReadEvent event,
            @Header(name = AmqpHeaders.MESSAGE_ID, required = false) String eventId) {
        log.debug("Activity: chapter read [{}]", event);

        save(eventId, event.userId(), ActivityEventType.CHAPTER_READ, new ChapterReadPayload(
                event.titleId(), event.titleName(), event.titleCover(), event.chapterNumber()));
    }

    @RabbitHandler
    public void handle(ReviewPostedEvent event,
            @Header(name = AmqpHeaders.MESSAGE_ID, required = false) String eventId) {
        log.debug("Activity: review posted [{}]", event);

        save(eventId, event.userId(), ActivityEventType.REVIEW_POSTED, new ReviewPostedPayload(
                event.titleId(), event.titleName(), event.titleCover(), event.reviewId(), event.rating()));
    }

    @RabbitHandler
    public void handle(TitleCompletedEvent event,
            @Header(name = AmqpHeaders.MESSAGE_ID, required = false) String eventId) {
        log.debug("Activity: title completed [{}]", event);

        save(eventId, event.userId(), ActivityEventType.TITLE_COMPLETED, new TitleCompletedPayload(
                event.titleId(), event.titleName(), event.titleCover()));
    }

    @RabbitHandler
    public void handle(UserFollowedEvent event,
            @Header(name = AmqpHeaders.MESSAGE_ID, required = false) String eventId) {
        log.debug("Activity: user followed [{}]", event);

        save(eventId, event.userId(), ActivityEventType.USER_FOLLOWED, new UserFollowedPayload(
                event.targetType(), event.targetId(), event.targetName(), event.targetAvatar()));
    }

    private void save(String eventId, String userId, ActivityEventType type, ActivityPayload payload) {
        recordActivityEventUseCase.execute(eventId, userId, type, payload);
    }
}
