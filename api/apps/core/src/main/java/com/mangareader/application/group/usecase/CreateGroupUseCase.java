package com.mangareader.application.group.usecase;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.DuplicateResourceException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo grupo. O criador se torna líder automaticamente.
 */
@Service
@RequiredArgsConstructor
public class CreateGroupUseCase {
    private final GroupRepositoryPort groupRepository;
    private final UserRepositoryPort userRepository;

    public record CreateGroupInput(
            UUID userId,
            Map<String, String> name,
            String username,
            Map<String, String> description,
            String logo,
            String banner,
            String website,
            Integer foundedYear
    ) {}

    @Transactional
    public Group execute(CreateGroupInput input) {
        if (groupRepository.existsByUsername(input.username())) {
            throw new DuplicateResourceException("Group", "username", input.username());
        }

        User creator = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        Group group = Group.builder()
                .name(toLocalized(input.name()))
                .username(input.username())
                .description(toLocalized(input.description()))
                .logo(input.logo())
                .banner(input.banner())
                .website(input.website())
                .foundedYear(input.foundedYear())
                .status(GroupStatus.ACTIVE)
                .build();

        GroupUser leader = GroupUser.builder()
                .group(group)
                .user(creator)
                .type(GroupUserType.MEMBER)
                .role(GroupRole.LIDER)
                .build();

        group.getGroupUsers().add(leader);

        return groupRepository.save(group);
    }

    private static LocalizedString toLocalized(Map<String, String> map) {
        return (map == null || map.isEmpty()) ? LocalizedString.empty() : LocalizedString.of(map);
    }
}
