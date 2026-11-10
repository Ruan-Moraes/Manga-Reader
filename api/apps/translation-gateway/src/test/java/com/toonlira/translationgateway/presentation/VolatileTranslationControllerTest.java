package com.toonlira.translationgateway.presentation;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.toonlira.translationgateway.application.ProcessVolatilePageUseCase;
import com.toonlira.translationgateway.application.VolatileAttemptUseCase;
import com.toonlira.translationgateway.infrastructure.security.RetiredContentRouteFilter;
import java.util.UUID;
import java.nio.ByteBuffer;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class VolatileTranslationControllerTest {
    @Test void returnsOneNoStoreBinaryResponseWithoutDownloadLocation() throws Exception {
        var processor = mock(ProcessVolatilePageUseCase.class);
        var attempts = mock(VolatileAttemptUseCase.class);
        var owner = UUID.randomUUID(); var key = UUID.randomUUID();
        doAnswer(call -> {
            ProcessVolatilePageUseCase.Sink sink = call.getArgument(4);
            sink.deliver(new byte[]{'{','}'}, new byte[]{1,2,3}, () -> { }); return null;
        }).when(processor).execute(eq(owner), eq(key), any(), any(), any());
        var mvc = MockMvcBuilders.standaloneSetup(new VolatileTranslationController(processor, attempts))
            .setControllerAdvice(new GatewayExceptionHandler()).build();
        var response = mvc.perform(post("/v2/page-translations").principal(new UsernamePasswordAuthenticationToken(owner, null))
            .contentType("image/png").content(new byte[]{1,2,3})
            .header("Idempotency-Key", key).header("X-Image-Byte-Size", 3).header("X-Image-Width", 1).header("X-Image-Height", 1)
            .header("X-Source-Language", "ja").header("X-Target-Language", "pt-BR").header("X-Disclosure-Version", "volatile-1"))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(header().doesNotExist("Location")).andReturn().getResponse();
        var bytes = ByteBuffer.wrap(response.getContentAsByteArray());
        assertThat(bytes.getInt()).isEqualTo(0x54565231);
        assertThat(bytes.getInt()).isEqualTo(2); assertThat(bytes.get()).isEqualTo((byte) '{'); assertThat(bytes.get()).isEqualTo((byte) '}');
        assertThat(bytes.getInt()).isEqualTo(3); assertThat(bytes.remaining()).isEqualTo(3);
        verify(processor).execute(eq(owner), eq(key), any(), any(), any());
    }
    @Test void rejectsRetiredContentRoutesBeforeReadingAnyBody() throws Exception {
        var filter = new RetiredContentRouteFilter();
        for (var path : new String[]{"/v1/capabilities", "/v1/page-jobs", "/v1/page-jobs/a/ack", "/internal/tasks/ocr"}) {
            var request = new MockHttpServletRequest("POST", path);
            request.setContentType("multipart/form-data;boundary=test");
            var response = new MockHttpServletResponse();
            filter.doFilter(request, response, (req, res) -> fail("Retired route reached application"));
            assertThat(response.getStatus()).isEqualTo(410);
            assertThat(response.getHeader("Cache-Control")).isEqualTo("no-store");
        }
    }
}
