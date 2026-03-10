package com.mangareader.presentation.manga.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.manga.usecase.GetChapterByNumberUseCase;
import com.mangareader.application.manga.usecase.GetChaptersByTitleUseCase;
import com.mangareader.domain.manga.valueobject.Chapter;
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

    private Chapter buildChapter(String number) {
        return Chapter.builder()
                .number(number)
                .title("Capítulo " + number)
                .releaseDate("2026-03-10")
                .pages("25")
                .build();
    }

    @Nested
    @DisplayName("GET /api/titles/{titleId}/chapters")
    class GetAll {

        @Test
        @DisplayName("Deve retornar 200 com lista de capítulos")
        void deveRetornar200ComCapitulos() throws Exception {
            var chapters = List.of(buildChapter("1"), buildChapter("2"), buildChapter("3"));
            when(getChaptersByTitleUseCase.execute("title-1")).thenReturn(chapters);

            mockMvc.perform(get("/api/titles/title-1/chapters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.length()").value(3))
                    .andExpect(jsonPath("$.data[0].number").value("1"))
                    .andExpect(jsonPath("$.data[0].title").value("Capítulo 1"));
        }

        @Test
        @DisplayName("Deve retornar 200 com lista vazia")
        void deveRetornarListaVazia() throws Exception {
            when(getChaptersByTitleUseCase.execute("title-x")).thenReturn(List.of());

            mockMvc.perform(get("/api/titles/title-x/chapters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/titles/{titleId}/chapters/{number}")
    class GetByNumber {

        @Test
        @DisplayName("Deve retornar 200 com capítulo encontrado")
        void deveRetornar200() throws Exception {
            when(getChapterByNumberUseCase.execute("title-1", "5"))
                    .thenReturn(buildChapter("5"));

            mockMvc.perform(get("/api/titles/title-1/chapters/5"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.number").value("5"))
                    .andExpect(jsonPath("$.data.pages").value("25"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando capítulo não encontrado")
        void deveRetornar404() throws Exception {
            when(getChapterByNumberUseCase.execute("title-1", "999"))
                    .thenThrow(new ResourceNotFoundException("Chapter", "number", "999"));

            mockMvc.perform(get("/api/titles/title-1/chapters/999"))
                    .andExpect(status().isNotFound());
        }
    }
}
