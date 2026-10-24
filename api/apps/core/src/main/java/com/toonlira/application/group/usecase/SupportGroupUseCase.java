package com.toonlira.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.application.shared.event.UserFollowedEvent;
import com.toonlira.application.shared.port.EventPublisherPort;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.group.entity.Group;
import com.toonlira.domain.group.entity.GroupUser;
import com.toonlira.domain.group.valueobject.GroupUserType;
import com.toonlira.domain.user.entity.User;
import com.toonlira.domain.user.entity.activity.FollowTargetType;
import com.toonlira.shared.application.i18n.LocaleResolutionService;
import com.toonlira.shared.exception.BusinessRuleException;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Adiciona o usuário como apoiador de um grupo.
 */
@Service
@RequiredArgsConstructor
public class SupportGroupUseCase {
    private final GroupRepositoryPort groupRepository;
    private final UserRepositoryPort userRepository;
    private final EventPublisherPort eventPublisher;
    private final LocaleResolutionService localeResolver;

    @Transactional
    public Group execute(UUID groupId, UUID userId) {
        // Fetch join de groupUsers/user: o mapper roda fora da sessão (open-in-view off).
        Group group = groupRepository.findByIdWithUsers(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        var existingLink = group.getGroupUsers().stream()
                .filter(gu -> gu.getUser().getId().equals(userId))
                .findFirst();

        if (existingLink.isPresent()) {
            if (existingLink.get().getType() == GroupUserType.MEMBER) {
                throw new BusinessRuleException("Você já é membro deste grupo — membros já são considerados seguidores automaticamente.", 409);
            }

            throw new BusinessRuleException("Usuário já possui vínculo com este grupo.", 409);
        }

        GroupUser supporter = GroupUser.builder()
                .group(group)
                .user(user)
                .type(GroupUserType.SUPPORTER)
                .build();

        group.getGroupUsers().add(supporter);

        Group saved = groupRepository.save(group);
        saved.getTranslatedWorks().size();

        eventPublisher.publish("activity.user-followed", new UserFollowedEvent(
                userId.toString(), FollowTargetType.GROUP, saved.getId().toString(),
                localeResolver.resolve(saved.getName()), saved.getLogo()));

        return saved;
    }
}
