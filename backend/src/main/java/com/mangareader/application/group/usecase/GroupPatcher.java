package com.mangareader.application.group.usecase;

import java.util.Map;

import com.mangareader.domain.group.entity.Group;
import com.mangareader.shared.domain.i18n.LocalizedString;

/**
 * Aplica patch parcial em {@link Group}. Compartilhado entre
 * {@link UpdateGroupUseCase} (líder do grupo) e
 * {@link com.mangareader.application.group.usecase.admin.UpdateAdminGroupUseCase}
 * (administrador). Mantém invariante: campos null são ignorados (PATCH semantic).
 */
public final class GroupPatcher {

    private GroupPatcher() {
    }

    public static void apply(Group group,
                             Map<String, String> name,
                             Map<String, String> description,
                             String logo,
                             String banner,
                             String website) {
        if (name != null) group.setName(LocalizedString.of(name));
        if (description != null) group.setDescription(LocalizedString.of(description));
        if (logo != null) group.setLogo(logo);
        if (banner != null) group.setBanner(banner);
        if (website != null) group.setWebsite(website);
    }
}
