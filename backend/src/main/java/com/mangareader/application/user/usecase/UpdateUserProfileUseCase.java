package com.mangareader.application.user.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.shared.event.UserProfileUpdatedEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserSocialLink;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza o perfil do usuário autenticado.
 * <p>
 * Permite alterar: name, bio, photoUrl, socialLinks.
 * Não permite alterar: email, role, passwordHash.
 */
@Service
@RequiredArgsConstructor
public class UpdateUserProfileUseCase {

    private final UserRepositoryPort userRepository;
    private final EventPublisherPort eventPublisher;

    public record UpdateProfileInput(
            UUID userId,
            String name,
            String bio,
            String photoUrl,
            List<SocialLinkInput> socialLinks
    ) {}

    public record SocialLinkInput(String platform, String url) {}

    public User execute(UpdateProfileInput input) {
        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        if (input.name() != null) {
            user.setName(input.name());
        }
        if (input.bio() != null) {
            user.setBio(input.bio());
        }
        if (input.photoUrl() != null) {
            user.setPhotoUrl(input.photoUrl());
        }

        if (input.socialLinks() != null) {
            // orphanRemoval cuida de deletar os links antigos
            user.getSocialLinks().clear();

            for (SocialLinkInput linkInput : input.socialLinks()) {
                UserSocialLink link = UserSocialLink.builder()
                        .user(user)
                        .platform(linkInput.platform())
                        .url(linkInput.url())
                        .build();
                user.getSocialLinks().add(link);
            }
        }

        User saved = userRepository.save(user);

        eventPublisher.publish("user.profile.updated",
                new UserProfileUpdatedEvent(
                        saved.getId().toString(),
                        saved.getName(),
                        saved.getPhotoUrl()));

        return saved;
    }
}
