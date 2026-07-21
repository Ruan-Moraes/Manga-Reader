package com.mangareader.infrastructure.messaging.consumer;

import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.shared.event.ChapterReadEvent;
import com.mangareader.application.shared.event.ReviewPostedEvent;
import com.mangareader.application.shared.event.TitleCompletedEvent;
import com.mangareader.application.shared.event.UserFollowedEvent;
import com.mangareader.application.user.usecase.RecordActivityEventUseCase;
import com.mangareader.domain.user.entity.ActivityEventType;
import com.mangareader.domain.user.entity.activity.ChapterReadPayload;
import com.mangareader.domain.user.entity.activity.FollowTargetType;
import com.mangareader.domain.user.entity.activity.ReviewPostedPayload;
import com.mangareader.domain.user.entity.activity.TitleCompletedPayload;
import com.mangareader.domain.user.entity.activity.UserFollowedPayload;

@ExtendWith(MockitoExtension.class)
@DisplayName("ActivityFeedConsumer")
class ActivityFeedConsumerTest {

    @Mock
    private RecordActivityEventUseCase recordActivityEventUseCase;

    @InjectMocks
    private ActivityFeedConsumer consumer;

    @Test
    @DisplayName("Deve gravar ActivityEvent CHAPTER_READ a partir de ChapterReadEvent")
    void deveGravarChapterRead() {
        consumer.handle(new ChapterReadEvent("u1", "t1", "Naruto", "cover.jpg", "5"), "event-1");

        verify(recordActivityEventUseCase).execute(
                "event-1", "u1", ActivityEventType.CHAPTER_READ,
                new ChapterReadPayload("t1", "Naruto", "cover.jpg", "5"));
    }

    @Test
    @DisplayName("Deve gravar ActivityEvent REVIEW_POSTED a partir de ReviewPostedEvent")
    void deveGravarReviewPosted() {
        consumer.handle(new ReviewPostedEvent("u1", "t1", "Naruto", "cover.jpg", "r1", 4.5), "event-2");

        verify(recordActivityEventUseCase).execute(
                "event-2", "u1", ActivityEventType.REVIEW_POSTED,
                new ReviewPostedPayload("t1", "Naruto", "cover.jpg", "r1", 4.5));
    }

    @Test
    @DisplayName("Deve gravar ActivityEvent TITLE_COMPLETED a partir de TitleCompletedEvent")
    void deveGravarTitleCompleted() {
        consumer.handle(new TitleCompletedEvent("u1", "t1", "Naruto", "cover.jpg"), "event-3");

        verify(recordActivityEventUseCase).execute(
                "event-3", "u1", ActivityEventType.TITLE_COMPLETED,
                new TitleCompletedPayload("t1", "Naruto", "cover.jpg"));
    }

    @Test
    @DisplayName("Deve gravar ActivityEvent USER_FOLLOWED a partir de UserFollowedEvent")
    void deveGravarUserFollowed() {
        consumer.handle(new UserFollowedEvent("u1", FollowTargetType.USER, "u2", "Alvo", "avatar.jpg"), "event-4");

        verify(recordActivityEventUseCase).execute(
                "event-4", "u1", ActivityEventType.USER_FOLLOWED,
                new UserFollowedPayload(FollowTargetType.USER, "u2", "Alvo", "avatar.jpg"));
    }
}
