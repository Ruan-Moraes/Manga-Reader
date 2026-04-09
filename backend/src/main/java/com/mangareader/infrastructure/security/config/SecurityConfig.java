package com.mangareader.infrastructure.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.mangareader.infrastructure.security.jwt.JwtAuthenticationFilter;
import com.mangareader.infrastructure.security.ratelimit.RateLimitFilter;

import lombok.RequiredArgsConstructor;

/**
 * Configuração do Spring Security.
 * <p>
 * Stateless (JWT), CSRF desabilitado, CORS delegado ao {@code CorsConfig}.
 * Exceções de autenticação/autorização retornam JSON via {@link SecurityExceptionHandler}.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SecurityExceptionHandler securityExceptionHandler;
    private final RateLimitFilter rateLimitFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titles/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titles").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ratings/title/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/groups/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/groups").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/news/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/news").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/forum/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/forum").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tags/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tags").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/tags").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tags/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tags/**").hasRole("ADMIN")

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/stores/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/stores").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}/profile").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}/comments").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}/history").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/error-logs").permitAll()

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Actuator: apenas health público, demais requerem autenticação
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/actuator/**").authenticated()

                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(securityExceptionHandler)
                        .accessDeniedHandler(securityExceptionHandler)
                )
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
