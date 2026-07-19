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
import java.time.Duration;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@DisplayName("RateLimitFilter — bucket estrito para endpoints de auth")
class RateLimitFilterTest {

    private RateLimitFilter filter;
    private TestStore store;

    @BeforeEach
    void setUp() {
        store = new TestStore();
        filter = new RateLimitFilter(new ObjectMapper(), store, properties());
    }

    private static RateLimitProperties properties() {
        return new RateLimitProperties(new RateLimitProperties.Policy(120, Duration.ofMinutes(1)),
                new RateLimitProperties.Policy(15, Duration.ofMinutes(1)), List.of("127.0.0.1", "::1"));
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

    @Test
    void ignoresForwardedHeadersFromUntrustedPeers() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/titles");
        request.setRemoteAddr("10.0.0.4");
        request.addHeader("X-Forwarded-For", "203.0.113.7");
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(store.keys()).containsExactly("10.0.0.4|general");
    }

    @Test
    void rejectsMalformedForwardedChainFromTrustedProxy() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/titles");
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.7, attacker.example");
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(store.keys()).containsExactly("127.0.0.1|general");
    }

    @Test
    void resolvesFirstUntrustedClientWalkingForwardedChainFromRightToLeft() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/titles");
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "198.51.100.23, 203.0.113.8, 127.0.0.1");
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(store.keys()).containsExactly("203.0.113.8|general");
    }

    @Test
    void twoFilterInstancesShareTheDistributedCounter() throws Exception {
        RateLimitFilter secondInstance = new RateLimitFilter(new ObjectMapper(), store, properties());
        for (int i = 0; i < 15; i++) perform("POST", "/api/auth/sign-in", "10.0.0.5");

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/sign-in");
        request.setRemoteAddr("10.0.0.5");
        MockHttpServletResponse response = new MockHttpServletResponse();
        secondInstance.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(429);
    }

    private static final class TestStore implements RateLimitStore {
        private final ConcurrentHashMap<String, Long> counters = new ConcurrentHashMap<>();

        @Override
        public Decision consume(String key, long capacity, Duration window) {
            long current = counters.merge(key, 1L, Long::sum);
            return new Decision(current <= capacity, Math.max(0, capacity - current), window.toSeconds());
        }

        java.util.Set<String> keys() { return counters.keySet(); }
    }
}
