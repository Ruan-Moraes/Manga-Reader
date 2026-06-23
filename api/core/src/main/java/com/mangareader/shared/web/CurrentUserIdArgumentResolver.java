package com.mangareader.shared.web;

import java.security.Principal;
import java.util.UUID;

import org.springframework.core.MethodParameter;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Resolve parâmetros {@link UUID} anotados com {@link CurrentUserId} a partir
 * do principal da request (mesma fonte do antigo
 * {@code extractUserId(Authentication)}: {@code Authentication#getPrincipal()}).
 */
public class CurrentUserIdArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUserId.class)
                && UUID.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(
            @NonNull MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            @NonNull NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory) {

        Principal principal = webRequest.getUserPrincipal();
        if (principal instanceof Authentication auth
                && auth.getPrincipal() instanceof UUID userId) {
            return userId;
        }
        return null;
    }
}
