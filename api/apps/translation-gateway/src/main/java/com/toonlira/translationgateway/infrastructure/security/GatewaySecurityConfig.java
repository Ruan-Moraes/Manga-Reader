package com.toonlira.translationgateway.infrastructure.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class GatewaySecurityConfig {
    @Bean
    SecurityFilterChain gatewaySecurity(HttpSecurity http, SessionAuthenticationFilter sessionFilter) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .requestCache(cache -> cache.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/v1/capabilities", "/v1/anonymous/installations", "/v1/anonymous/sessions",
                    "/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers("/v1/page-jobs/**").authenticated()
                .anyRequest().denyAll())
            .addFilterBefore(sessionFilter, AnonymousAuthenticationFilter.class)
            .build();
    }
}
