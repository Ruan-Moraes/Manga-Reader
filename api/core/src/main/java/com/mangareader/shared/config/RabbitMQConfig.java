package com.mangareader.shared.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Topologia RabbitMQ: exchange, filas e bindings.
 * <p>
 * Exchange {@code manga.events} (topic, durable). O monolito apenas <b>publica</b>
 * eventos {@code rating.*} (consumidos pelo serviço {@code rating-aggregator},
 * que declara a própria fila) e mantém a fila de denormalização de usuário:
 * <ul>
 *   <li>{@code manga.user.denormalize} — routing key {@code user.profile.updated}</li>
 * </ul>
 * Desabilitado no profile "test".
 */
@Configuration
@Profile("!test")
public class RabbitMQConfig {
    public static final String EXCHANGE = "manga.events";

    public static final String QUEUE_USER_DENORMALIZE   = "manga.user.denormalize";

    public static final String ROUTING_KEY_USER_PROFILE = "user.profile.updated";

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
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
