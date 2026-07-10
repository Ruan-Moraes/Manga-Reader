package com.mangareader.infrastructure.messaging.consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.shared.event.ChapterReadEvent;
import com.mangareader.application.shared.event.ReviewPostedEvent;
import com.mangareader.application.shared.event.TitleCompletedEvent;
import com.mangareader.application.shared.event.UserFollowedEvent;
import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.domain.user.entity.ActivityEvent;
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
    private ActivityEventRepositoryPort activityEventRepository;

    @InjectMocks
    private ActivityFeedConsumer consumer;

    @Test
    @DisplayName("Deve gravar ActivityEvent CHAPTER_READ a partir de ChapterReadEvent")
    void deveGravarChapterRead() {
        when(activityEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        consumer.handle(new ChapterReadEvent("u1", "t1", "Naruto", "cover.jpg", "5"));

        ArgumentCaptor<ActivityEvent> captor = ArgumentCaptor.forClass(ActivityEvent.class);
        verify(activityEventRepository).save(captor.capture());
        ActivityEvent saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo("u1");
        assertThat(saved.getType()).isEqualTo(ActivityEventType.CHAPTER_READ);
        assertThat(saved.getPayload()).isEqualTo(new ChapterReadPayload("t1", "Naruto", "cover.jpg", "5"));
    }

    @Test
    @DisplayName("Deve gravar ActivityEvent REVIEW_POSTED a partir de ReviewPostedEvent")
    void deveGravarReviewPosted() {
        when(activityEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        consumer.handle(new ReviewPostedEvent("u1", "t1", "Naruto", "cover.jpg", "r1", 4.5));

        ArgumentCaptor<ActivityEvent> captor = ArgumentCaptor.forClass(ActivityEvent.class);
        verify(activityEventRepository).save(captor.capture());
        ActivityEvent saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(ActivityEventType.REVIEW_POSTED);
        assertThat(saved.getPayload()).isEqualTo(new ReviewPostedPayload("t1", "Naruto", "cover.jpg", "r1", 4.5));
    }

    @Test
    @DisplayName("Deve gravar ActivityEvent TITLE_COMPLETED a partir de TitleCompletedEvent")
    void deveGravarTitleCompleted() {
        when(activityEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        consumer.handle(new TitleCompletedEvent("u1", "t1", "Naruto", "cover.jpg"));

        ArgumentCaptor<ActivityEvent> captor = ArgumentCaptor.forClass(ActivityEvent.class);
        verify(activityEventRepository).save(captor.capture());
        ActivityEvent saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(ActivityEventType.TITLE_COMPLETED);
        assertThat(saved.getPayload()).isEqualTo(new TitleCompletedPayload("t1", "Naruto", "cover.jpg"));
    }

    @Test
    @DisplayName("Deve gravar ActivityEvent USER_FOLLOWED a partir de UserFollowedEvent")
    void deveGravarUserFollowed() {
        when(activityEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        consumer.handle(new UserFollowedEvent("u1", FollowTargetType.USER, "u2", "Alvo", "avatar.jpg"));

        ArgumentCaptor<ActivityEvent> captor = ArgumentCaptor.forClass(ActivityEvent.class);
        verify(activityEventRepository).save(captor.capture());
        ActivityEvent saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(ActivityEventType.USER_FOLLOWED);
        assertThat(saved.getPayload())
                .isEqualTo(new UserFollowedPayload(FollowTargetType.USER, "u2", "Alvo", "avatar.jpg"));
    }
}
