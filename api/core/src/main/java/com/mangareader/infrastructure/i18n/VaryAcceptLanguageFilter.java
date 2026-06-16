package com.mangareader.infrastructure.i18n;

import java.io.IOException;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Adiciona {@code Vary: Accept-Language} em todas as respostas HTTP.
 *
 * <p>Justificativa: catálogo é resolvido por locale do request. Sem o header,
 * caches HTTP intermediários (CDN, proxy reverso, browser) podem servir resposta
 * de um idioma para usuário em outro. Etapa 3 i18n.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class VaryAcceptLanguageFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        response.addHeader("Vary", "Accept-Language");

        chain.doFilter(request, response);
    }
}
