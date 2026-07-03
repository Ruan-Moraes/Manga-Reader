package com.mangareader.application.social.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.social.model.UserSummary;
import com.mangareader.application.social.port.SocialGraphPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetFollowersUseCase (DT-48)")
class GetFollowersUseCaseTest {

    @Mock
    private SocialGraphPort socialGraph;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private GetFollowersUseCase useCase;

    private final UUID TARGET = UUID.randomUUID();
    private final UUID A = UUID.randomUUID();
    private final UUID B = UUID.randomUUID();

    private User buildUser(UUID id, String name, boolean deactivated) {
        User user = User.builder().id(id).name(name).email(name + "@mr.com").passwordHash("h").build();
        user.setDeactivated(deactivated);
        return user;
    }

    @Test
    @DisplayName("Hidrata em lote preservando a ordem do grafo")
    void hidrataPreservandoOrdem() {
        Pageable pageable = PageRequest.of(0, 10);
        when(socialGraph.listFollowers(TARGET, pageable)).thenReturn(new PageImpl<>(List.of(B, A), pageable, 2));
        // findAllById devolve fora de ordem de propósito
        when(userRepository.findAllById(List.of(B, A)))
                .thenReturn(List.of(buildUser(A, "alice", false), buildUser(B, "bob", false)));

        Page<UserSummary> result = useCase.execute(TARGET, pageable);

        assertThat(result.getContent()).extracting(UserSummary::name).containsExactly("bob", "alice");
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("Filtra contas desativadas na hidratação")
    void filtraDesativados() {
        Pageable pageable = PageRequest.of(0, 10);
        when(socialGraph.listFollowers(TARGET, pageable)).thenReturn(new PageImpl<>(List.of(A, B), pageable, 2));
        when(userRepository.findAllById(List.of(A, B)))
                .thenReturn(List.of(buildUser(A, "alice", false), buildUser(B, "bob", true)));

        Page<UserSummary> result = useCase.execute(TARGET, pageable);

        assertThat(result.getContent()).extracting(UserSummary::name).containsExactly("alice");
    }

    @Test
    @DisplayName("Página vazia do grafo não consulta o Postgres")
    void paginaVaziaSemHidratacao() {
        Pageable pageable = PageRequest.of(0, 10);
        when(socialGraph.listFollowers(any(), any())).thenReturn(Page.empty(pageable));

        Page<UserSummary> result = useCase.execute(TARGET, pageable);

        assertThat(result.getContent()).isEmpty();
        verifyNoInteractions(userRepository);
    }
}
