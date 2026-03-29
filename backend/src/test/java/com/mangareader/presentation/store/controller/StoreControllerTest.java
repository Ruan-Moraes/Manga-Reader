package com.mangareader.presentation.store.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.store.usecase.GetStoreByIdUseCase;
import com.mangareader.application.store.usecase.GetStoresByTitleIdUseCase;
import com.mangareader.application.store.usecase.GetStoresUseCase;
import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreAvailability;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(StoreController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("StoreController")
class StoreControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetStoresUseCase getStoresUseCase;

    @MockitoBean
    private GetStoreByIdUseCase getStoreByIdUseCase;

    @MockitoBean
    private GetStoresByTitleIdUseCase getStoresByTitleIdUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    private Store buildStore(UUID id, String name) {
        return Store.builder()
                .id(id)
                .name(name)
                .website("https://example.com")
                .availability(StoreAvailability.IN_STOCK)
                .rating(4.5)
                .build();
    }

    @Nested
    @DisplayName("GET /api/stores")
    class GetAll {

        @Test
        @DisplayName("Deve retornar 200 com stores paginadas")
        void deveRetornar200ComStores() throws Exception {
            var stores = List.of(
                    buildStore(UUID.randomUUID(), "Amazon"),
                    buildStore(UUID.randomUUID(), "Crunchyroll Store")
            );
            when(getStoresUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(stores));

            mockMvc.perform(get("/api/stores"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].name").value("Amazon"));
        }

        @Test
        @DisplayName("Deve retornar página vazia quando não há stores")
        void deveRetornarPaginaVazia() throws Exception {
            when(getStoresUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/stores"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/stores/{id}")
    class GetById {

        @Test
        @DisplayName("Deve retornar 200 com store encontrada")
        void deveRetornar200() throws Exception {
            var id = UUID.randomUUID();
            when(getStoreByIdUseCase.execute(id)).thenReturn(buildStore(id, "Book Walker"));

            mockMvc.perform(get("/api/stores/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Book Walker"))
                    .andExpect(jsonPath("$.data.website").value("https://example.com"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando store não existe")
        void deveRetornar404() throws Exception {
            var id = UUID.randomUUID();
            when(getStoreByIdUseCase.execute(id))
                    .thenThrow(new ResourceNotFoundException("Store", "id", id));

            mockMvc.perform(get("/api/stores/{id}", id))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/stores/title/{titleId}")
    class GetByTitleId {

        @Test
        @DisplayName("Deve retornar 200 com stores paginadas para o título")
        void deveRetornar200ComStores() throws Exception {
            var stores = List.of(
                    buildStore(UUID.randomUUID(), "Amazon"),
                    buildStore(UUID.randomUUID(), "Comixology")
            );
            when(getStoresByTitleIdUseCase.execute(any(String.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(stores));

            mockMvc.perform(get("/api/stores/title/507f1f77bcf86cd799439011"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2));
        }

        @Test
        @DisplayName("Deve retornar 200 com página vazia quando nenhuma store vende o título")
        void deveRetornarPaginaVazia() throws Exception {
            when(getStoresByTitleIdUseCase.execute(any(String.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/stores/title/titulo-sem-store"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }
}
