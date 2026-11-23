package com.toonlira.translationgateway.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Rejects the retired content transport before DispatcherServlet can parse multipart or invoke an old worker. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RetiredContentRouteFilter extends OncePerRequestFilter {
    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        var path = request.getRequestURI();
        return !path.equals("/v1/capabilities") && !path.equals("/v1/page-jobs") && !path.startsWith("/v1/page-jobs/")
            && !path.equals("/internal/tasks/ocr");
    }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        response.setStatus(HttpServletResponse.SC_GONE);
        response.setHeader("Cache-Control", "no-store");
        response.setContentType("application/problem+json");
        response.getWriter().write("{\"contractVersion\":\"2.0\",\"code\":\"content-route-retired\",\"retryable\":false}");
    }
}
