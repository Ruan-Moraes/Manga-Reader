package com.mangareader.aggregator.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JavaTypeMapper.TypePrecedence;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Topologia RabbitMQ do aggregator.
 * <p>
 * Liga uma fila própria {@code manga.rating.aggregate} ao exchange compartilhado
 * {@code manga.events} com routing {@code rating.#}. Como é uma fila distinta da
 * do monolito, ambos recebem cópia dos eventos sem competir.
 */
@Configuration
public class RabbitMQConfig {
    public static final String EXCHANGE = "manga.events";
    public static final String QUEUE_RATING_AGGREGATE = "manga.rating.aggregate";
    public static final String ROUTING_KEY_RATING = "rating.#";

    @Bean
    public TopicExchange mangaEventsExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue ratingAggregateQueue() {
        return QueueBuilder.durable(QUEUE_RATING_AGGREGATE).build();
    }

    @Bean
    public Binding ratingAggregateBinding(Queue ratingAggregateQueue, TopicExchange mangaEventsExchange) {
        return BindingBuilder.bind(ratingAggregateQueue)
                .to(mangaEventsExchange)
                .with(ROUTING_KEY_RATING);
    }

    /**
     * Converte JSON ↔ POJO. {@link TypePrecedence#INFERRED} usa o tipo do
     * parâmetro do {@code @RabbitListener} em vez do header {@code __TypeId__},
     * desserializando o {@code RatingEvent} mesmo se o FQN do publicador divergir.
     */
    @Bean
    public MessageConverter jackson2JsonMessageConverter() {
        var converter = new Jackson2JsonMessageConverter();

        var typeMapper = new DefaultJackson2JavaTypeMapper();
        typeMapper.setTrustedPackages("com.mangareader.*");
        typeMapper.setTypePrecedence(TypePrecedence.INFERRED);

        converter.setJavaTypeMapper(typeMapper);

        return converter;
    }
}
