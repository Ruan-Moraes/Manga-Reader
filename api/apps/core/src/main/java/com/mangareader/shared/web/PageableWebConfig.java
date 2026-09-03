package com.mangareader.shared.web;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Registra os argument resolvers de web custom (DT-23):
 * {@link PageableArgumentResolver} (paginação via {@code @PageParams Pageable})
 * e {@link CurrentUserIdArgumentResolver} ({@code @CurrentUserId UUID}) —
 * eliminam {@code buildPageable}/{@code extractUserId} dos controllers.
 *
 * <p>Config dedicada (sem {@code @Value}) para poder ser importada isolada em
 * {@code @WebMvcTest} via {@code @Import(PageableWebConfig.class)}.
 */
@Configuration
public class PageableWebConfig implements WebMvcConfigurer {

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new PageableArgumentResolver());
        resolvers.add(new CurrentUserIdArgumentResolver());
    }
}
