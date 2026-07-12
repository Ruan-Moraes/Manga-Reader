package com.mangareader.trending;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class TrendingAggregatorApplication {
    public static void main(String[] args) { SpringApplication.run(TrendingAggregatorApplication.class, args); }
}
