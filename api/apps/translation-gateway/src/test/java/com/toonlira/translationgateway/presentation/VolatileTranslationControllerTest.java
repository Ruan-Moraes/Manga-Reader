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
        var mvc = MockMvcBuilders.standaloneSetup(new VolatileTranslationController(processor, attempts, mock(com.toonlira.translationgateway.application.SeedChapterGlossaryUseCase.class), new com.toonlira.translationgateway.application.config.GatewayProperties()))
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

    /** MOB-FEAT-022/023 over v2: the optional chapter reference reaches the page command. */
    @Test void anOptionalChapterReferenceReachesTheCommand() throws Exception {
        var processor = mock(ProcessVolatilePageUseCase.class);
        var owner = UUID.randomUUID();
        var mvc = MockMvcBuilders.standaloneSetup(new VolatileTranslationController(processor, mock(VolatileAttemptUseCase.class),
                mock(com.toonlira.translationgateway.application.SeedChapterGlossaryUseCase.class),
                new com.toonlira.translationgateway.application.config.GatewayProperties()))
            .setControllerAdvice(new GatewayExceptionHandler()).build();
        var chapter = UUID.randomUUID();
        for (var withChapter : new boolean[]{true, false}) {
            var request = post("/v2/page-translations").principal(new UsernamePasswordAuthenticationToken(owner, null))
                .contentType("image/png").content(new byte[]{1, 2, 3})
                .header("Idempotency-Key", UUID.randomUUID()).header("X-Image-Byte-Size", 3).header("X-Image-Width", 1)
                .header("X-Image-Height", 1).header("X-Source-Language", "en").header("X-Target-Language", "pt-BR")
                .header("X-Disclosure-Version", "volatile-1");
            if (withChapter) request.header("X-Context-Ref", chapter);
            mvc.perform(request);
        }
        var commands = org.mockito.ArgumentCaptor.forClass(ProcessVolatilePageUseCase.Command.class);
        verify(processor, times(2)).execute(eq(owner), any(), commands.capture(), any(), any());
        assertThat(commands.getAllValues()).extracting(ProcessVolatilePageUseCase.Command::contextRef).containsExactly(chapter, null);
    }

    /** MOB-FEAT-023 over v2: the glossary refills the chapter memory under the current disclosure; malformed is 400. */
    @Test void aChapterGlossaryRefillsTheMemoryOnlyUnderTheCurrentDisclosure() throws Exception {
        var processor = mock(ProcessVolatilePageUseCase.class);
        var glossaries = mock(com.toonlira.translationgateway.application.SeedChapterGlossaryUseCase.class);
        var properties = new com.toonlira.translationgateway.application.config.GatewayProperties();
        properties.getDisclosure().setVersion("volatile-2026-11-21.v1");
        var owner = UUID.randomUUID();
        var chapter = UUID.randomUUID();
        var mvc = MockMvcBuilders.standaloneSetup(new VolatileTranslationController(processor, mock(VolatileAttemptUseCase.class), glossaries, properties))
            .setControllerAdvice(new GatewayExceptionHandler()).build();
        var glossary = "[{\"source\":\"Coriander\",\"target\":\"Coriander\"}]";
        when(glossaries.parse(glossary)).thenReturn(java.util.Map.of("Coriander", "Coriander"));
        mvc.perform(put("/v2/page-translations/chapter-contexts/" + chapter + "/glossary").principal(new UsernamePasswordAuthenticationToken(owner, null))
                .param("sourceLanguage", "en").param("targetLanguage", "pt-BR").header("X-Disclosure-Version", "volatile-2026-11-21.v1")
                .contentType("application/json").content(glossary))
            .andExpect(status().isNoContent()).andExpect(header().string("Cache-Control", "no-store"));
        verify(glossaries).seed(owner, chapter, "en", "pt-BR", java.util.Map.of("Coriander", "Coriander"));

        // Another disclosure: the stored names were not consented to.
        mvc.perform(put("/v2/page-translations/chapter-contexts/" + chapter + "/glossary").principal(new UsernamePasswordAuthenticationToken(owner, null))
                .param("sourceLanguage", "en").param("targetLanguage", "pt-BR").header("X-Disclosure-Version", "volatile-old")
                .contentType("application/json").content(glossary))
            .andExpect(status().isConflict());
        when(glossaries.parse("[not json")).thenThrow(new com.toonlira.translationgateway.domain.GatewayException(
            com.toonlira.translationgateway.domain.GatewayErrorCode.INVALID_REQUEST, 400, false));
        mvc.perform(put("/v2/page-translations/chapter-contexts/" + chapter + "/glossary").principal(new UsernamePasswordAuthenticationToken(owner, null))
                .param("sourceLanguage", "en").param("targetLanguage", "pt-BR").header("X-Disclosure-Version", "volatile-2026-11-21.v1")
                .contentType("application/json").content("[not json"))
            .andExpect(status().isBadRequest());
        verify(glossaries, times(1)).seed(any(), any(), any(), any(), any());
    }
}
