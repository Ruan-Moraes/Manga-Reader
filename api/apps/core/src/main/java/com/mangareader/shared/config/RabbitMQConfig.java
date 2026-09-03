package com.mangareader.shared.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.retry.RepublishMessageRecoverer;
import org.springframework.boot.autoconfigure.amqp.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.retry.interceptor.RetryOperationsInterceptor;

@Configuration
@Profile("!test")
public class RabbitMQConfig {
    public static final String EXCHANGE = "manga.events";

    public static final String QUEUE_USER_DENORMALIZE   = "manga.user.denormalize";
    public static final String QUEUE_ACTIVITY_FEED       = "manga.activity.feed";
    public static final String QUEUE_ACTIVITY_FEED_DLQ   = "manga.activity.feed.dlq";
    public static final String QUEUE_BEHAVIOR_ANALYTICS  = "manga.behavior.analytics";
    public static final String QUEUE_BEHAVIOR_ANALYTICS_DLQ = "manga.behavior.analytics.dlq";
    public static final String EXCHANGE_ERRORS           = "manga.events.errors";
    public static final String ROUTING_KEY_ACTIVITY_FAILED = "manga.activity.feed.failed";
    public static final String ROUTING_KEY_BEHAVIOR_EVENT = "analytics.behavior";
    public static final String ROUTING_KEY_BEHAVIOR_FAILED = "manga.behavior.analytics.failed";

    public static final String ROUTING_KEY_USER_PROFILE  = "user.profile.updated";
    public static final String ROUTING_KEY_ACTIVITY_WILDCARD = "activity.*";

    @Bean
    public TopicExchange mangaEventsExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue userDenormalizeQueue() {
        return QueueBuilder.durable(QUEUE_USER_DENORMALIZE).build();
    }

    @Bean
    public Binding userDenormalizeBinding(Queue userDenormalizeQueue, TopicExchange mangaEventsExchange) {
        return BindingBuilder.bind(userDenormalizeQueue)
                .to(mangaEventsExchange)
                .with(ROUTING_KEY_USER_PROFILE);
    }

    @Bean
    public Queue activityFeedQueue() {
        return QueueBuilder.durable(QUEUE_ACTIVITY_FEED).build();
    }

    @Bean
    public Binding activityFeedBinding(Queue activityFeedQueue, TopicExchange mangaEventsExchange) {
        return BindingBuilder.bind(activityFeedQueue)
                .to(mangaEventsExchange)
                .with(ROUTING_KEY_ACTIVITY_WILDCARD);
    }

    @Bean
    public Queue behaviorAnalyticsQueue() {
        return QueueBuilder.durable(QUEUE_BEHAVIOR_ANALYTICS).build();
    }

    @Bean
    public Binding behaviorAnalyticsBinding(Queue behaviorAnalyticsQueue, TopicExchange mangaEventsExchange) {
        return BindingBuilder.bind(behaviorAnalyticsQueue)
                .to(mangaEventsExchange)
                .with(ROUTING_KEY_BEHAVIOR_EVENT);
    }

    @Bean
    public DirectExchange mangaEventsErrorExchange() {
        return ExchangeBuilder.directExchange(EXCHANGE_ERRORS).durable(true).build();
    }

    @Bean
    public Queue activityFeedDeadLetterQueue() {
        return QueueBuilder.durable(QUEUE_ACTIVITY_FEED_DLQ).build();
    }

    @Bean
    public Binding activityFeedDeadLetterBinding(Queue activityFeedDeadLetterQueue,
            DirectExchange mangaEventsErrorExchange) {
        return BindingBuilder.bind(activityFeedDeadLetterQueue)
                .to(mangaEventsErrorExchange)
                .with(ROUTING_KEY_ACTIVITY_FAILED);
    }

    @Bean
    public Queue behaviorAnalyticsDeadLetterQueue() {
        return QueueBuilder.durable(QUEUE_BEHAVIOR_ANALYTICS_DLQ).build();
    }

    @Bean
    public Binding behaviorAnalyticsDeadLetterBinding(Queue behaviorAnalyticsDeadLetterQueue,
            DirectExchange mangaEventsErrorExchange) {
        return BindingBuilder.bind(behaviorAnalyticsDeadLetterQueue)
                .to(mangaEventsErrorExchange)
                .with(ROUTING_KEY_BEHAVIOR_FAILED);
    }

    @Bean
    public RetryOperationsInterceptor activityRetryInterceptor(RabbitTemplate rabbitTemplate) {
        return retryInterceptor(rabbitTemplate, ROUTING_KEY_ACTIVITY_FAILED);
    }

    @Bean
    public RetryOperationsInterceptor behaviorRetryInterceptor(RabbitTemplate rabbitTemplate) {
        return retryInterceptor(rabbitTemplate, ROUTING_KEY_BEHAVIOR_FAILED);
    }

    private RetryOperationsInterceptor retryInterceptor(RabbitTemplate rabbitTemplate, String failureRoutingKey) {
        var recoverer = new RepublishMessageRecoverer(rabbitTemplate, EXCHANGE_ERRORS, failureRoutingKey);
        return RetryInterceptorBuilder.stateless()
                .maxAttempts(3)
                .backOffOptions(1_000, 2, 4_000)
                .recoverer(recoverer)
                .build();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory activityRabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            @Qualifier("activityRetryInterceptor") RetryOperationsInterceptor activityRetryInterceptor) {
        var factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setAdviceChain(activityRetryInterceptor);
        factory.setDefaultRequeueRejected(false);
        return factory;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory behaviorRabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            @Qualifier("behaviorRetryInterceptor") RetryOperationsInterceptor behaviorRetryInterceptor) {
        var factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setAdviceChain(behaviorRetryInterceptor);
        factory.setDefaultRequeueRejected(false);
        return factory;
    }

    @Bean
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
