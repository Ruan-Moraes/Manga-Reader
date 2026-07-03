package com.mangareader.presentation.social.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.group.usecase.GetFollowedGroupsUseCase;
import com.mangareader.application.social.model.UserSummary;
import com.mangareader.application.social.port.SocialGraphPort.ProfileSocial;
import com.mangareader.application.social.usecase.FollowUserUseCase;
import com.mangareader.application.social.usecase.GetFollowersUseCase;
import com.mangareader.application.social.usecase.GetFollowingUseCase;
import com.mangareader.application.social.usecase.UnfollowUserUseCase;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.presentation.group.mapper.GroupMapper;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.web.PageableWebConfig;

@WebMvcTest(FollowController.class)
@Import(PageableWebConfig.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("FollowController (DT-48)")
class FollowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FollowUserUseCase followUserUseCase;

    @MockitoBean
    private UnfollowUserUseCase unfollowUserUseCase;

    @MockitoBean
    private GetFollowersUseCase getFollowersUseCase;

    @MockitoBean
    private GetFollowingUseCase getFollowingUseCase;

    @MockitoBean
    private GetFollowedGroupsUseCase getFollowedGroupsUseCase;

    @MockitoBean
    private GroupMapper groupMapper;

    @MockitoBean
    private TokenPort tokenPort;

    private final UUID VIEWER_ID = UUID.randomUUID();
    private final UUID TARGET_ID = UUID.randomUUID();

    private Authentication mockAuth() {
        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(VIEWER_ID);
        return auth;
    }

    private UserSummary summary(String name) {
        return new UserSummary(UUID.randomUUID().toString(), name, name, null, false);
    }

    @Nested
    @DisplayName("POST/DELETE /api/users/{id}/follow")
    class FollowUnfollow {

        @Test
        @DisplayName("POST retorna estado do follow para reconciliação otimista")
        void followRetornaEstado() throws Exception {
            when(followUserUseCase.execute(VIEWER_ID, TARGET_ID)).thenReturn(new ProfileSocial(5, 2, true));

            mockMvc.perform(post("/api/users/{id}/follow", TARGET_ID).principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.following").value(true))
                    .andExpect(jsonPath("$.data.followersCount").value(5));
        }

        @Test
        @DisplayName("Seguir a si mesmo propaga 409")
        void selfFollow409() throws Exception {
            when(followUserUseCase.execute(eq(VIEWER_ID), any(UUID.class)))
                    .thenThrow(new BusinessRuleException("Não é possível seguir a si mesmo", 409));

            mockMvc.perform(post("/api/users/{id}/follow", VIEWER_ID).principal(mockAuth()))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("DELETE retorna estado atualizado")
        void unfollowRetornaEstado() throws Exception {
            when(unfollowUserUseCase.execute(VIEWER_ID, TARGET_ID)).thenReturn(new ProfileSocial(4, 2, false));

            mockMvc.perform(delete("/api/users/{id}/follow", TARGET_ID).principal(mockAuth()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.following").value(false))
                    .andExpect(jsonPath("$.data.followersCount").value(4));
        }
    }

    @Nested
    @DisplayName("GET /api/users/{id}/followers|following")
    class Listas {

        @Test
        @DisplayName("followers pagina e mapeia o read model")
        void followersPaginado() throws Exception {
            Pageable pageable = PageRequest.of(0, 20);
            when(getFollowersUseCase.execute(eq(TARGET_ID), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(summary("alice"), summary("bob")), pageable, 2));

            mockMvc.perform(get("/api/users/{id}/followers", TARGET_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.content[0].name").value("alice"))
                    .andExpect(jsonPath("$.data.totalElements").value(2));
        }

        @Test
        @DisplayName("following pagina e mapeia o read model")
        void followingPaginado() throws Exception {
            Pageable pageable = PageRequest.of(0, 20);
            when(getFollowingUseCase.execute(eq(TARGET_ID), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(summary("carol")), pageable, 1));

            mockMvc.perform(get("/api/users/{id}/following", TARGET_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content.length()").value(1))
                    .andExpect(jsonPath("$.data.content[0].username").value("carol"));
        }

        @Test
        @DisplayName("followed-groups delega ao use case e mapeia via GroupMapper")
        void followedGroups() throws Exception {
            Group group = Group.builder().id(UUID.randomUUID()).build();
            when(getFollowedGroupsUseCase.execute(TARGET_ID)).thenReturn(List.of(group));
            when(groupMapper.toPreviewResponse(group)).thenReturn(null);

            mockMvc.perform(get("/api/users/{id}/followed-groups", TARGET_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.length()").value(1));
        }
    }
}
