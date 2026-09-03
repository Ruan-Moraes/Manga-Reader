package com.mangareader.presentation.manga.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.manga.usecase.GetChapterByNumberUseCase;
import com.mangareader.application.manga.usecase.GetChaptersByTitleUseCase;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.ResourceNotFoundException;

@WebMvcTest(ChapterController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ChapterController")
class ChapterControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetChaptersByTitleUseCase getChaptersByTitleUseCase;

    @MockitoBean
    private GetChapterByNumberUseCase getChapterByNumberUseCase;

    @MockitoBean
    private com.mangareader.application.manga.usecase.GetReaderChapterUseCase getReaderChapterUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private com.mangareader.presentation.shared.mapper.LocalizedMappingHelper i18n;

    @org.junit.jupiter.api.BeforeEach
    void stubI18n() {
        when(i18n.toResolvedString(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(inv -> {
                    var ls = inv.getArgument(0, LocalizedString.class);

                    return ls == null ? "" : ls.resolve(null);
                });
    }

    private Chapter buildChapter(String number) {
        return Chapter.builder()
                .id("chapter-" + number)
                .titleId("title-1")
                .number(number)
                .title(LocalizedString.ofDefault("Capítulo " + number))
                .releaseDate("2026-03-10")
                .pages("25")
                .build();
    }

    @Nested
    @DisplayName("GET /api/titles/{titleId}/chapters")
    class GetAll {
        @Test
        @DisplayName("Deve retornar 200 com página de capítulos")
        void deveRetornar200ComCapitulos() throws Exception {
            Page<Chapter> page = new PageImpl<>(
                    List.of(buildChapter("1"), buildChapter("2"), buildChapter("3")),
                    PageRequest.of(0, 20), 3);

            when(getChaptersByTitleUseCase.execute(eq("title-1"), any(Pageable.class), org.mockito.ArgumentMatchers.isNull()))
                    .thenReturn(page);

            mockMvc.perform(get("/api/titles/title-1/chapters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(3))
                    .andExpect(jsonPath("$.data.content[0].id").value("chapter-1"))
                    .andExpect(jsonPath("$.data.content[0].number").value("1"))
                    .andExpect(jsonPath("$.data.content[0].title").value("Capítulo 1"))
                    .andExpect(jsonPath("$.data.totalElements").value(3));
        }

        @Test
        @DisplayName("direction=desc gera Pageable ordenado desc por number")
        void direcaoDescOrdenaNumber() throws Exception {
            when(getChaptersByTitleUseCase.execute(eq("title-1"), any(Pageable.class), org.mockito.ArgumentMatchers.isNull()))
                    .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

            mockMvc.perform(get("/api/titles/title-1/chapters")
                            .param("direction", "desc"))
                    .andExpect(status().isOk());

            var captor = ArgumentCaptor.forClass(Pageable.class);

            verify(getChaptersByTitleUseCase).execute(eq("title-1"), captor.capture(), org.mockito.ArgumentMatchers.isNull());

            var order = captor.getValue().getSort().getOrderFor("number");

            assertThat(order).isNotNull();
            assertThat(order.getDirection().isDescending()).isTrue();
        }

        @Test
        @DisplayName("default (sem direction) ordena asc por number")
        void defaultOrdenaAsc() throws Exception {
            when(getChaptersByTitleUseCase.execute(eq("title-1"), any(Pageable.class), org.mockito.ArgumentMatchers.isNull()))
                    .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

            mockMvc.perform(get("/api/titles/title-1/chapters"))
                    .andExpect(status().isOk());

            var captor = ArgumentCaptor.forClass(Pageable.class);

            verify(getChaptersByTitleUseCase).execute(eq("title-1"), captor.capture(), org.mockito.ArgumentMatchers.isNull());

            var order = captor.getValue().getSort().getOrderFor("number");

            assertThat(order).isNotNull();
            assertThat(order.getDirection().isAscending()).isTrue();
        }

        @Test
        @DisplayName("Deve retornar 200 com página vazia")
        void deveRetornarPaginaVazia() throws Exception {
            when(getChaptersByTitleUseCase.execute(eq("title-x"), any(Pageable.class), org.mockito.ArgumentMatchers.isNull()))
                    .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

            mockMvc.perform(get("/api/titles/title-x/chapters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/titles/{titleId}/chapters/{number}")
    class GetByNumber {
        @Test
        @DisplayName("Deve retornar 200 com capítulo encontrado")
        void deveRetornar200() throws Exception {
            when(getChapterByNumberUseCase.execute(eq("title-1"), eq("5"), org.mockito.ArgumentMatchers.isNull()))
                    .thenReturn(buildChapter("5"));

            mockMvc.perform(get("/api/titles/title-1/chapters/5"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value("chapter-5"))
                    .andExpect(jsonPath("$.data.number").value("5"))
                    .andExpect(jsonPath("$.data.pages").value("25"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando capítulo não encontrado")
        void deveRetornar404() throws Exception {
            when(getChapterByNumberUseCase.execute(eq("title-1"), eq("999"), org.mockito.ArgumentMatchers.isNull()))
                    .thenThrow(new ResourceNotFoundException("Chapter", "number", "999"));

            mockMvc.perform(get("/api/titles/title-1/chapters/999"))
                    .andExpect(status().isNotFound());
        }
    }

    @Test
    @DisplayName("Moderador pode solicitar preview de capítulo não publicado")
    void moderatorCanPreviewChapter() throws Exception {
        UUID moderatorId = UUID.randomUUID();
        Chapter chapter = buildChapter("7");
        when(getReaderChapterUseCase.execute("title-1", "7", true, moderatorId)).thenReturn(chapter);
        var auth = new UsernamePasswordAuthenticationToken(
                moderatorId, null, List.of(new SimpleGrantedAuthority("ROLE_MODERATOR")));

        mockMvc.perform(get("/api/titles/title-1/chapters/7/reader")
                        .param("preview", "true")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("chapter-7"));

        verify(getReaderChapterUseCase).execute("title-1", "7", true, moderatorId);
    }
}
