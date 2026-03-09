package com.mangareader.infrastructure.messaging.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import com.mangareader.application.shared.event.UserProfileUpdatedEvent;
import com.mangareader.shared.config.RabbitMQConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Consumer que desnormaliza dados de perfil do usuário nos documentos MongoDB.
 * <p>
 * Quando o perfil é alterado, atualiza:
 * <ul>
 *   <li>{@code comments} — campos {@code userName} e {@code userPhoto}</li>
 *   <li>{@code ratings} — campo {@code userName}</li>
 * </ul>
 */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class UserDenormalizationConsumer {
    private final MongoTemplate mongoTemplate;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_USER_DENORMALIZE)
    public void handleUserProfileUpdate(UserProfileUpdatedEvent event) {
        log.info("Denormalizing user data for userId: {}", event.userId());

        updateComments(event);
        updateRatings(event);
    }

    private void updateComments(UserProfileUpdatedEvent event) {
        Query query = new Query(Criteria.where("userId").is(event.userId()));

        Update update = new Update();

        boolean hasUpdates = false;

        if (event.newName() != null) {
            update.set("userName", event.newName());

            hasUpdates = true;
        }

        if (event.newPhotoUrl() != null) {
            update.set("userPhoto", event.newPhotoUrl());

            hasUpdates = true;
        }

        if (!hasUpdates) return;

        var result = mongoTemplate.updateMulti(query, update, "comments");

        log.debug("Updated {} comments for userId {}", result.getModifiedCount(), event.userId());
    }

    private void updateRatings(UserProfileUpdatedEvent event) {
        if (event.newName() == null) return;

        Query query = new Query(Criteria.where("userId").is(event.userId()));

        Update update = new Update().set("userName", event.newName());

        var result = mongoTemplate.updateMulti(query, update, "ratings");

        log.debug("Updated {} ratings for userId {}", result.getModifiedCount(), event.userId());
    }
}
