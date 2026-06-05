package com.mangareader.shared.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.context.request.NativeWebRequest;

import com.mangareader.shared.exception.BusinessRuleException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PageableArgumentResolver")
class PageableArgumentResolverTest {

    private final PageableArgumentResolver resolver = new PageableArgumentResolver();

    @Mock
    private NativeWebRequest request;

    @SuppressWarnings("unused")
    static class Sample {
        void plain(Pageable p) {
        }

        void configured(
                @PageParams(defaultSize = 10, defaultSort = "createdAt",
                        defaultDirection = "desc",
                        allow = {"createdAt", "rating"})
                Pageable p) {
        }

        void semantic(
                @PageParams(defaultSort = "name", defaultDirection = "asc",
                        ignoreRequestSort = true)
                Pageable p) {
        }

        void notPageable(String s) {
        }
    }

    private MethodParameter param(String method, Class<?>... args) throws Exception {
        Method m = Sample.class.getDeclaredMethod(method, args);
        return new MethodParameter(m, 0);
    }

    private Pageable resolve(String method, Class<?> argType) throws Exception {
        return (Pageable) resolver.resolveArgument(
                param(method, argType), null, request, null);
    }

    @Test
    @DisplayName("supportsParameter true só para Pageable")
    void supports() throws Exception {
        assertThat(resolver.supportsParameter(param("plain", Pageable.class)))
                .isTrue();
        assertThat(resolver.supportsParameter(param("notPageable", String.class)))
                .isFalse();
    }

    @Test
    @DisplayName("Sem params usa defaults do @PageParams")
    void defaults() throws Exception {
        Pageable p = resolve("configured", Pageable.class);

        assertThat(p.getPageNumber()).isZero();
        assertThat(p.getPageSize()).isEqualTo(10);
        var order = p.getSort().getOrderFor("createdAt");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("sort/direction da query sobrepõem default")
    void requestOverrides() throws Exception {
        when(request.getParameter("page")).thenReturn("2");
        when(request.getParameter("size")).thenReturn("5");
        when(request.getParameter("sort")).thenReturn("rating");
        when(request.getParameter("direction")).thenReturn("asc");

        Pageable p = resolve("configured", Pageable.class);

        assertThat(p.getPageNumber()).isEqualTo(2);
        assertThat(p.getPageSize()).isEqualTo(5);
        var order = p.getSort().getOrderFor("rating");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    @DisplayName("Campo fora da whitelist → BusinessRuleException 400")
    void whitelistRejects() throws Exception {
        when(request.getParameter("sort")).thenReturn("name");

        assertThatThrownBy(() -> resolve("configured", Pageable.class))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("ignoreRequestSort ignora sort/direction da query")
    void ignoreRequestSort() throws Exception {
        Pageable p = resolve("semantic", Pageable.class);

        var order = p.getSort().getOrderFor("name");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC);
        assertThat(p.getSort().getOrderFor("MOST_READ")).isNull();
    }
}
