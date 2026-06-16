package com.mangareader.presentation.admin.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.author.usecase.CreateAuthorUseCase;
import com.mangareader.application.author.usecase.DeleteAuthorUseCase;
import com.mangareader.application.author.usecase.UpdateAuthorUseCase;
import com.mangareader.domain.author.entity.Author;

@WebMvcTest(AdminAuthorController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminAuthorController")
class AdminAuthorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenPort tokenPort;

    @MockitoBean
    private CreateAuthorUseCase createAuthorUseCase;

    @MockitoBean
    private UpdateAuthorUseCase updateAuthorUseCase;

    @MockitoBean
    private DeleteAuthorUseCase deleteAuthorUseCase;

    private Author buildAuthor() {
        return Author.builder().id(1L).name("Eiichiro Oda").slug("eiichiro-oda").nationality("JP").build();
    }

    @Test
    @DisplayName("POST /api/admin/authors — deve retornar 201")
    void deveCriar() throws Exception {
        when(createAuthorUseCase.execute(any())).thenReturn(buildAuthor());

        mockMvc.perform(post("/api/admin/authors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Eiichiro Oda\", \"nationality\": \"JP\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.slug").value("eiichiro-oda"));
    }

    @Test
    @DisplayName("POST /api/admin/authors — deve retornar 400 quando nome em branco")
    void deveValidarNomeObrigatorio() throws Exception {
        mockMvc.perform(post("/api/admin/authors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/admin/authors/{id} — deve retornar 200")
    void deveAtualizar() throws Exception {
        when(updateAuthorUseCase.execute(any())).thenReturn(buildAuthor());

        mockMvc.perform(put("/api/admin/authors/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Eiichiro Oda\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("DELETE /api/admin/authors/{id} — deve retornar 204")
    void deveExcluir() throws Exception {
        mockMvc.perform(delete("/api/admin/authors/1"))
                .andExpect(status().isNoContent());

        verify(deleteAuthorUseCase).execute(eq(1L));
    }
}
