package com.toonlira.presentation.manga.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.toonlira.application.auth.port.TokenPort;
import com.toonlira.application.manga.usecase.GetReleaseFeedUseCase;
import com.toonlira.application.user.usecase.MarkReleaseSeenUseCase;
import com.toonlira.shared.exception.BusinessRuleException;
import com.toonlira.shared.exception.ResourceNotFoundException;
import com.toonlira.shared.web.PageableWebConfig;

@WebMvcTest(ReleaseController.class)
@Import(PageableWebConfig.class)
@AutoConfigureMockMvc(addFilters = false)
class ReleaseControllerTest {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private GetReleaseFeedUseCase getReleaseFeed;

    @MockitoBean
    private MarkReleaseSeenUseCase markReleaseSeen;

    @MockitoBean
    private TokenPort tokenPort;

    @Test
    void returnsApiResponseWithReleasePage() throws Exception {
        var item = new GetReleaseFeedUseCase.Item(
                "chapter-1", "title-1", "Berserk", "cover.jpg", "370", "Retorno",
                Instant.parse("2026-07-25T12:00:00Z"), "pt-BR", "group-1",
                "Scan Brasileira", "logo.png", false);
        when(getReleaseFeed.execute(any())).thenReturn(new GetReleaseFeedUseCase.Result(
                new PageImpl<>(List.of(item), PageRequest.of(0, 30), 1),
                List.of("pt-BR")));

        mvc.perform(get("/api/releases")
                        .param("period", "WEEK")
                        .param("timeZone", "America/Sao_Paulo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.releases.content[0].chapterId").value("chapter-1"))
                .andExpect(jsonPath("$.data.releases.content[0].scanGroup.name").value("Scan Brasileira"))
                .andExpect(jsonPath("$.data.availableLanguages[0]").value("pt-BR"));
    }

    @Test
    void returnsUnauthorizedForAnonymousLibraryFeed() throws Exception {
        when(getReleaseFeed.execute(any()))
                .thenThrow(new BusinessRuleException("Authentication is required", 401));

        mvc.perform(get("/api/releases").param("libraryOnly", "true"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void returnsBadRequestForInvalidTimeZoneAndNotFoundForMissingChapter() throws Exception {
        when(getReleaseFeed.execute(any())).thenThrow(new IllegalArgumentException("Invalid time zone"));

        mvc.perform(get("/api/releases").param("timeZone", "not/a-zone"))
                .andExpect(status().isBadRequest());

        UUID userId = UUID.randomUUID();
        var principal = new UsernamePasswordAuthenticationToken(userId, null, List.of());
        doThrow(new ResourceNotFoundException("Chapter", "id", "missing"))
                .when(markReleaseSeen).markChapter(userId, "missing");

        mvc.perform(put("/api/releases/missing/seen").principal(principal))
                .andExpect(status().isNotFound());
    }

    @Test
    void marksChapterAndWholeDayForAuthenticatedUser() throws Exception {
        UUID userId = UUID.randomUUID();
        var principal = new UsernamePasswordAuthenticationToken(userId, null, List.of());
        doNothing().when(markReleaseSeen).markChapter(userId, "chapter-1");
        when(markReleaseSeen.markDay(userId, java.time.LocalDate.parse("2026-07-25"),
                "America/Sao_Paulo")).thenReturn(12L);

        mvc.perform(put("/api/releases/chapter-1/seen").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        mvc.perform(put("/api/releases/days/2026-07-25/seen")
                        .param("timeZone", "America/Sao_Paulo")
                        .principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.markedCount").value(12));

        verify(markReleaseSeen).markChapter(userId, "chapter-1");
    }
}
