package com.mangareader.presentation.category.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.category.usecase.CreateTagUseCase;
import com.mangareader.application.category.usecase.DeleteTagUseCase;
import com.mangareader.application.category.usecase.GetTagByIdUseCase;
import com.mangareader.application.category.usecase.GetTagsUseCase;
import com.mangareader.application.category.usecase.SearchTagsUseCase;
import com.mangareader.application.category.usecase.UpdateTagUseCase;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(TagController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("TagController")
class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetTagsUseCase getTagsUseCase;

    @MockitoBean
    private GetTagByIdUseCase getTagByIdUseCase;

    @MockitoBean
    private SearchTagsUseCase searchTagsUseCase;

    @MockitoBean
    private CreateTagUseCase createTagUseCase;

    @MockitoBean
    private UpdateTagUseCase updateTagUseCase;

    @MockitoBean
    private DeleteTagUseCase deleteTagUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    @Nested
    @DisplayName("GET /api/tags")
    class GetAll {

        @Test
        @DisplayName("Deve retornar 200 com página de tags")
        void deveRetornar200ComPagina() throws Exception {
            var tags = List.of(
                    Tag.builder().id(1L).label("Ação").build(),
                    Tag.builder().id(2L).label("Aventura").build());
            when(getTagsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(tags));

            mockMvc.perform(get("/api/tags"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].value").value(1))
                    .andExpect(jsonPath("$.data.content[0].label").value("Ação"));
        }

        @Test
        @DisplayName("Deve retornar página vazia")
        void deveRetornarPaginaVazia() throws Exception {
            when(getTagsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/tags"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty())
                    .andExpect(jsonPath("$.data.totalElements").value(0));
        }
    }

    @Nested
    @DisplayName("GET /api/tags/{id}")
    class GetById {

        @Test
        @DisplayName("Deve retornar 200 com tag encontrada")
        void deveRetornar200ComTag() throws Exception {
            var tag = Tag.builder().id(1L).label("Romance").build();
            when(getTagByIdUseCase.execute(1L)).thenReturn(tag);

            mockMvc.perform(get("/api/tags/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.value").value(1))
                    .andExpect(jsonPath("$.data.label").value("Romance"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando tag não existe")
        void deveRetornar404() throws Exception {
            when(getTagByIdUseCase.execute(999L))
                    .thenThrow(new ResourceNotFoundException("Tag", "id", "999"));

            mockMvc.perform(get("/api/tags/999"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/tags/search")
    class Search {

        @Test
        @DisplayName("Deve retornar 200 com resultados da busca")
        void deveRetornar200ComResultados() throws Exception {
            var tags = List.of(Tag.builder().id(1L).label("Aventura").build());
            when(searchTagsUseCase.execute(eq("aven"), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(tags));

            mockMvc.perform(get("/api/tags/search").param("q", "aven"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content.length()").value(1))
                    .andExpect(jsonPath("$.data.content[0].label").value("Aventura"));
        }
    }

    @Nested
    @DisplayName("POST /api/tags")
    class Create {

        @Test
        @DisplayName("Deve retornar 201 ao criar tag")
        void deveRetornar201AoCriarTag() throws Exception {
            var tag = Tag.builder().id(1L).label("Nova Tag").build();
            when(createTagUseCase.execute("Nova Tag")).thenReturn(tag);

            mockMvc.perform(post("/api/tags")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"label\":\"Nova Tag\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.value").value(1))
                    .andExpect(jsonPath("$.data.label").value("Nova Tag"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando label em branco")
        void deveRetornar400QuandoLabelEmBranco() throws Exception {
            mockMvc.perform(post("/api/tags")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"label\":\"\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/tags/{id}")
    class Update {

        @Test
        @DisplayName("Deve retornar 200 ao atualizar tag")
        void deveRetornar200AoAtualizarTag() throws Exception {
            var tag = Tag.builder().id(1L).label("Atualizada").build();
            when(updateTagUseCase.execute(eq(1L), eq("Atualizada"))).thenReturn(tag);

            mockMvc.perform(put("/api/tags/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"label\":\"Atualizada\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.label").value("Atualizada"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando tag nao existe")
        void deveRetornar404QuandoTagNaoExiste() throws Exception {
            when(updateTagUseCase.execute(eq(999L), eq("Qualquer")))
                    .thenThrow(new ResourceNotFoundException("Tag", "id", "999"));

            mockMvc.perform(put("/api/tags/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"label\":\"Qualquer\"}"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/tags/{id}")
    class Delete {

        @Test
        @DisplayName("Deve retornar 204 ao deletar tag")
        void deveRetornar204AoDeletarTag() throws Exception {
            doNothing().when(deleteTagUseCase).execute(1L);

            mockMvc.perform(delete("/api/tags/1"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("Deve retornar 404 quando tag nao existe")
        void deveRetornar404QuandoTagNaoExiste() throws Exception {
            doThrow(new ResourceNotFoundException("Tag", "id", "999"))
                    .when(deleteTagUseCase).execute(999L);

            mockMvc.perform(delete("/api/tags/999"))
                    .andExpect(status().isNotFound());
        }
    }
}
