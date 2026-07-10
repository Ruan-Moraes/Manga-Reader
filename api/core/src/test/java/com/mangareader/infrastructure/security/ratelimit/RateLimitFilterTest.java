package com.mangareader.infrastructure.security.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.fasterxml.jackson.databind.ObjectMapper;

@DisplayName("RateLimitFilter — bucket estrito para endpoints de auth")
class RateLimitFilterTest {

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter(new ObjectMapper());
    }

    private MockHttpServletResponse perform(String method, String uri, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr(ip);

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        return response;
    }

    @Test
    @DisplayName("POST /api/auth/* deve estourar em 429 após o burst estrito (15)")
    void authPostShouldHitStrictLimit() throws Exception {
        for (int i = 0; i < 15; i++) {
            assertThat(perform("POST", "/api/auth/sign-in", "10.0.0.1").getStatus())
                    .isEqualTo(HttpStatus.OK.value());
        }

        assertThat(perform("POST", "/api/auth/sign-in", "10.0.0.1").getStatus())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    @Test
    @DisplayName("Bucket estrito de auth não deve afetar navegação comum do mesmo IP")
    void strictBucketShouldNotAffectRegularTraffic() throws Exception {
        for (int i = 0; i < 16; i++) {
            perform("POST", "/api/auth/sign-in", "10.0.0.2");
        }

        // Mesmo IP esgotou o bucket de auth, mas navegação segue no bucket global
        assertThat(perform("GET", "/api/titles", "10.0.0.2").getStatus())
                .isEqualTo(HttpStatus.OK.value());
    }

    @Test
    @DisplayName("GET /api/auth/me usa o bucket global (só POST é estrito)")
    void getMeUsesGlobalBucket() throws Exception {
        for (int i = 0; i < 20; i++) {
            assertThat(perform("GET", "/api/auth/me", "10.0.0.3").getStatus())
                    .isEqualTo(HttpStatus.OK.value());
        }
    }
}
