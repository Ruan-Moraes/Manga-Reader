package com.mangareader.trending;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;
import io.mongock.runner.springboot.EnableMongock;

@EnableScheduling
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableMongock
public class TrendingAggregatorApplication {
    public static void main(String[] args) { SpringApplication.run(TrendingAggregatorApplication.class, args); }
}
