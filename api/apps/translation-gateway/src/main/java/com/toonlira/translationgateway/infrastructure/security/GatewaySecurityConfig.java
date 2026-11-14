package com.toonlira.translationgateway.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;

@Configuration
@Profile("!worker")
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class GatewaySecurityConfig {
    /** Swagger/OpenAPI: liberados só com gateway.docs.public=true (perfil local). */
    private static final String[] DOCS_PATHS = {
        "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**"
    };
    private static final String[] NO_PATHS = {};

    @Bean
    SecurityFilterChain gatewaySecurity(
        HttpSecurity http,
        SessionAuthenticationFilter sessionFilter,
        @Value("${gateway.docs.public:false}") boolean docsPublic
    ) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .requestCache(cache -> cache.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/v1/capabilities", "/v1/anonymous/installations", "/v1/anonymous/sessions",
                    "/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers("/v1/page-jobs/**").authenticated()
                .requestMatchers(docsPublic ? DOCS_PATHS : NO_PATHS).permitAll()
                .anyRequest().denyAll())
            .addFilterBefore(sessionFilter, AnonymousAuthenticationFilter.class)
            .build();
    }
}
