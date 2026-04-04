package com.mangareader.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupMember;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.domain.user.entity.User;
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
            String name,
            String username,
            String description,
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
                .name(input.name())
                .username(input.username())
                .description(input.description())
                .logo(input.logo())
                .banner(input.banner())
                .website(input.website())
                .foundedYear(input.foundedYear())
                .status(GroupStatus.ACTIVE)
                .build();

        // O criador é o líder
        GroupMember leader = GroupMember.builder()
                .group(group)
                .user(creator)
                .role(GroupRole.LIDER)
                .build();

        group.getMembers().add(leader);

        return groupRepository.save(group);
    }
}
