package com.toonlira.translationgateway.infrastructure.json;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;

@Configuration(proxyBeanMethods = false)
public class GatewayJsonConfiguration {
    @Bean
    JsonMapper gatewayJsonMapper() { return GatewayJsonMapper.create(); }
}
