package com.mangareader.application.group.usecase.admin;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza grupo via admin (sem checagem de líder). Mapas multilíngues; nulos
 * mantêm valor atual.
 */
@Service
@RequiredArgsConstructor
public class UpdateAdminGroupUseCase {
    private final GroupRepositoryPort groupRepository;

    public record UpdateAdminGroupInput(
            UUID groupId,
            Map<String, String> name,
            Map<String, String> description,
            String logo,
            String banner,
            String website
    ) {}

    @Transactional
    public Group execute(UpdateAdminGroupInput input) {
        Group group = groupRepository.findById(input.groupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", input.groupId()));

        if (input.name() != null) group.setName(LocalizedString.of(input.name()));
        if (input.description() != null) group.setDescription(LocalizedString.of(input.description()));
        if (input.logo() != null) group.setLogo(input.logo());
        if (input.banner() != null) group.setBanner(input.banner());
        if (input.website() != null) group.setWebsite(input.website());

        return groupRepository.save(group);
    }
}
