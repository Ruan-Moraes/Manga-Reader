package com.mangareader.presentation.group.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.group.usecase.AddWorkToGroupUseCase;
import com.mangareader.application.group.usecase.CreateGroupUseCase;
import com.mangareader.application.group.usecase.GetGroupByIdUseCase;
import com.mangareader.application.group.usecase.GetGroupByUsernameUseCase;
import com.mangareader.application.group.usecase.GetGroupsByTitleIdUseCase;
import com.mangareader.application.group.usecase.GetGroupsUseCase;
import com.mangareader.application.group.usecase.JoinGroupUseCase;
import com.mangareader.application.group.usecase.LeaveGroupUseCase;
import com.mangareader.application.group.usecase.RemoveWorkFromGroupUseCase;
import com.mangareader.application.group.usecase.UpdateGroupUseCase;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.auth.port.TokenPort;

@WebMvcTest(GroupController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("GroupController")
class GroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetGroupsUseCase getGroupsUseCase;

    @MockitoBean
    private GetGroupByIdUseCase getGroupByIdUseCase;

    @MockitoBean
    private GetGroupByUsernameUseCase getGroupByUsernameUseCase;

    @MockitoBean
    private GetGroupsByTitleIdUseCase getGroupsByTitleIdUseCase;

    @MockitoBean
    private CreateGroupUseCase createGroupUseCase;

    @MockitoBean
    private UpdateGroupUseCase updateGroupUseCase;

    @MockitoBean
    private JoinGroupUseCase joinGroupUseCase;

    @MockitoBean
    private LeaveGroupUseCase leaveGroupUseCase;

    @MockitoBean
    private AddWorkToGroupUseCase addWorkToGroupUseCase;

    @MockitoBean
    private RemoveWorkFromGroupUseCase removeWorkFromGroupUseCase;

    @MockitoBean
    private TokenPort tokenPort;

    private final UUID USER_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(USER_ID);
        return auth;
    }

    private Group buildGroup(UUID id) {
        return Group.builder()
                .id(id)
                .name("Scan Traduções")
                .username("scan-traducoes")
                .description("Grupo de tradução")
                .logo("logo.png")
                .banner("banner.png")
                .website("https://example.com")
                .foundedYear(2020)
                .status(GroupStatus.ACTIVE)
                .members(new ArrayList<>())
                .translatedWorks(new ArrayList<>())
                .genres(List.of("Ação", "Aventura"))
                .focusTags(List.of("manhwa"))
                .platformJoinedAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .build();
    }

    @Nested
    @DisplayName("GET /api/groups")
    class GetAll {

        @Test
        @DisplayName("Deve retornar 200 com grupos paginados")
        void deveRetornar200ComGrupos() throws Exception {
            var groups = List.of(buildGroup(UUID.randomUUID()), buildGroup(UUID.randomUUID()));
            when(getGroupsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(groups));

            mockMvc.perform(get("/api/groups"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].name").value("Scan Traduções"));
        }

        @Test
        @DisplayName("Deve retornar página vazia")
        void deveRetornarPaginaVazia() throws Exception {
            when(getGroupsUseCase.execute(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/groups"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/groups/{id}")
    class GetById {

        @Test
        @DisplayName("Deve retornar 200 com grupo encontrado")
        void deveRetornar200() throws Exception {
            var id = UUID.randomUUID();
            when(getGroupByIdUseCase.execute(id)).thenReturn(buildGroup(id));

            mockMvc.perform(get("/api/groups/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Scan Traduções"))
                    .andExpect(jsonPath("$.data.username").value("scan-traducoes"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando grupo não encontrado")
        void deveRetornar404() throws Exception {
            var id = UUID.randomUUID();
            when(getGroupByIdUseCase.execute(id))
                    .thenThrow(new ResourceNotFoundException("Group", "id", id));

            mockMvc.perform(get("/api/groups/{id}", id))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/groups/username/{username}")
    class GetByUsername {

        @Test
        @DisplayName("Deve retornar 200 com grupo encontrado por username")
        void deveRetornar200() throws Exception {
            when(getGroupByUsernameUseCase.execute("scan-traducoes"))
                    .thenReturn(buildGroup(UUID.randomUUID()));

            mockMvc.perform(get("/api/groups/username/scan-traducoes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.username").value("scan-traducoes"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando username não encontrado")
        void deveRetornar404() throws Exception {
            when(getGroupByUsernameUseCase.execute("inexistente"))
                    .thenThrow(new ResourceNotFoundException("Group", "username", "inexistente"));

            mockMvc.perform(get("/api/groups/username/inexistente"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/groups/title/{titleId}")
    class GetByTitleId {

        @Test
        @DisplayName("Deve retornar 200 com lista de grupos por título")
        void deveRetornar200() throws Exception {
            when(getGroupsByTitleIdUseCase.execute("title-1"))
                    .thenReturn(List.of(buildGroup(UUID.randomUUID())));

            mockMvc.perform(get("/api/groups/title/title-1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.length()").value(1));
        }

        @Test
        @DisplayName("Deve retornar 200 com lista vazia")
        void deveRetornarListaVazia() throws Exception {
            when(getGroupsByTitleIdUseCase.execute("title-x"))
                    .thenReturn(List.of());

            mockMvc.perform(get("/api/groups/title/title-x"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    @Nested
    @DisplayName("POST /api/groups")
    class Create {

        @Test
        @DisplayName("Deve retornar 201 ao criar grupo")
        void deveRetornar201() throws Exception {
            var group = buildGroup(UUID.randomUUID());
            when(createGroupUseCase.execute(any())).thenReturn(group);

            mockMvc.perform(post("/api/groups")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "Novo Grupo", "username": "novo-grupo", "description": "Desc", "foundedYear": 2024}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Scan Traduções"));
        }

        @Test
        @DisplayName("Deve retornar 400 quando nome está em branco")
        void deveRetornar400NomeEmBranco() throws Exception {
            mockMvc.perform(post("/api/groups")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "", "username": "grupo"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando username está em branco")
        void deveRetornar400UsernameEmBranco() throws Exception {
            mockMvc.perform(post("/api/groups")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "Grupo X", "username": ""}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/groups/{id}/join")
    class Join {

        @Test
        @DisplayName("Deve retornar 200 ao entrar no grupo")
        void deveRetornar200() throws Exception {
            var id = UUID.randomUUID();
            var group = buildGroup(id);
            when(joinGroupUseCase.execute(any())).thenReturn(group);

            mockMvc.perform(post("/api/groups/{id}/join", id)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Scan Traduções"));
        }
    }

    @Nested
    @DisplayName("PUT /api/groups/{id}")
    class Update {

        @Test
        @DisplayName("Deve retornar 200 ao atualizar grupo")
        void deveRetornar200() throws Exception {
            var id = UUID.randomUUID();
            var group = buildGroup(id);
            when(updateGroupUseCase.execute(any())).thenReturn(group);

            mockMvc.perform(put("/api/groups/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "Nome Atualizado", "description": "Nova descrição"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve retornar 400 quando nome tem menos de 2 caracteres")
        void deveRetornar400NomeMuitoCurto() throws Exception {
            var id = UUID.randomUUID();
            mockMvc.perform(put("/api/groups/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "A"}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/groups/{id}/leave")
    class Leave {

        @Test
        @DisplayName("Deve retornar 200 ao sair do grupo")
        void deveRetornar200() throws Exception {
            var id = UUID.randomUUID();
            var group = buildGroup(id);
            when(leaveGroupUseCase.execute(id, USER_ID)).thenReturn(group);

            mockMvc.perform(delete("/api/groups/{id}/leave", id)
                            .principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("POST /api/groups/{id}/works")
    class AddWork {

        @Test
        @DisplayName("Deve retornar 201 ao adicionar obra")
        void deveRetornar201() throws Exception {
            var id = UUID.randomUUID();
            var group = buildGroup(id);
            when(addWorkToGroupUseCase.execute(any())).thenReturn(group);

            mockMvc.perform(post("/api/groups/{id}/works", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "t1", "title": "Solo Leveling", "cover": "cover.png", "chapters": 200, "status": "Em andamento", "genres": ["Ação"]}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve retornar 400 quando titleId está em branco")
        void deveRetornar400TitleIdEmBranco() throws Exception {
            var id = UUID.randomUUID();
            mockMvc.perform(post("/api/groups/{id}/works", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "", "title": "Solo Leveling", "chapters": 10}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Deve retornar 400 quando title da obra está em branco")
        void deveRetornar400TitleEmBranco() throws Exception {
            var id = UUID.randomUUID();
            mockMvc.perform(post("/api/groups/{id}/works", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "t1", "title": "", "chapters": 10}
                                    """)
                            .principal(mockAuth()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/groups/{id}/works/{titleId}")
    class RemoveWork {

        @Test
        @DisplayName("Deve retornar 204 ao remover obra")
        void deveRetornar204() throws Exception {
            var id = UUID.randomUUID();

            mockMvc.perform(delete("/api/groups/{id}/works/{titleId}", id, "title-1")
                            .principal(mockAuth()))
                    .andExpect(status().isNoContent());

            verify(removeWorkFromGroupUseCase).execute(id, USER_ID, "title-1");
        }
    }
}
