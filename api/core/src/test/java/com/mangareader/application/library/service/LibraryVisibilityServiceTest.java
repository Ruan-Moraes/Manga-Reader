package com.mangareader.application.library.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

@ExtendWith(MockitoExtension.class)
@DisplayName("LibraryVisibilityService (DT-49)")
class LibraryVisibilityServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private UserProfileSettingsResolver profileSettingsResolver;

    @InjectMocks
    private LibraryVisibilityService service;

    private final UUID OWNER_ID = UUID.randomUUID();
    private final UUID VIEWER_ID = UUID.randomUUID();

    private User buildOwner() {
        return User.builder().id(OWNER_ID).name("Dono").email("dono@mr.com").build();
    }

    private UserProfileSettings settingsWith(VisibilitySetting libraryVisibility) {
        return UserProfileSettings.builder().libraryVisibility(libraryVisibility).build();
    }

    @Test
    @DisplayName("Dono sempre pode ver a própria biblioteca, sem consultar settings")
    void donoSempreVe() {
        assertThat(service.canView(OWNER_ID, OWNER_ID)).isTrue();
        verifyNoInteractions(userRepository, profileSettingsResolver);
    }

    @Test
    @DisplayName("Terceiro vê quando libraryVisibility é PUBLIC")
    void terceiroVeQuandoPublica() {
        User owner = buildOwner();
        when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(owner));
        when(profileSettingsResolver.getOrDefault(owner)).thenReturn(settingsWith(VisibilitySetting.PUBLIC));

        assertThat(service.canView(OWNER_ID, VIEWER_ID)).isTrue();
    }

    @Test
    @DisplayName("Terceiro NÃO vê quando libraryVisibility é PRIVATE")
    void terceiroNaoVeQuandoPrivada() {
        User owner = buildOwner();
        when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(owner));
        when(profileSettingsResolver.getOrDefault(owner)).thenReturn(settingsWith(VisibilitySetting.PRIVATE));

        assertThat(service.canView(OWNER_ID, VIEWER_ID)).isFalse();
    }

    @Test
    @DisplayName("Viewer anônimo (null) segue a visibilidade do dono")
    void anonimoSegueVisibilidade() {
        User owner = buildOwner();
        when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(owner));
        when(profileSettingsResolver.getOrDefault(owner)).thenReturn(settingsWith(VisibilitySetting.PUBLIC));

        assertThat(service.canView(OWNER_ID, null)).isTrue();
    }

    @Test
    @DisplayName("Dono inexistente ⇒ não pode ver (página vazia no caller)")
    void donoInexistenteNaoVe() {
        when(userRepository.findById(OWNER_ID)).thenReturn(Optional.empty());

        assertThat(service.canView(OWNER_ID, VIEWER_ID)).isFalse();
    }
}
