package com.mangareader.presentation.shared.mapper;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

/**
 * Helper para mappers MapStruct converterem campos {@link LocalizedString} /
 * {@link LocalizedStringList} entre formatos de DTO público (string já resolvida)
 * e DTO admin (mapa com todas as traduções).
 *
 * <p>Registre nos mappers via {@code @Mapper(uses = LocalizedMappingHelper.class)}.
 */
@Component
public class LocalizedMappingHelper {

    private final LocaleResolutionService resolver;

    public LocalizedMappingHelper(LocaleResolutionService resolver) {
        this.resolver = resolver;
    }

    /** Resolve para o locale ativo — usado em DTOs públicos. */
    public String toResolvedString(LocalizedString field) {
        return resolver.resolve(field);
    }

    public List<String> toResolvedList(LocalizedStringList field) {
        return resolver.resolve(field);
    }

    /**
     * Resolve para o locale ativo; se {@code i18n} vazio/nulo, cai para o
     * {@code slug} (chave técnica imutável). Usado exclusivamente por
     * DomainLabel — value enum acompanha tradução, exibido cru quando
     * tradução ausente.
     *
     * <p><b>Não usar como fallback de migração</b> — Phase B i18n já consolidou
     * campos canônicos; entidades pós-Fase B não devem ter "legacy String".
     */
    public String resolveOrSlug(LocalizedString i18n, String slug) {
        if (i18n != null && !i18n.isEmpty()) {
            return resolver.resolve(i18n);
        }
        return slug;
    }

    /** Expõe todas as traduções — usado em DTOs admin. */
    public Map<String, String> toMap(LocalizedString field) {
        return field == null ? Map.of() : field.values();
    }

    public Map<String, List<String>> toListMap(LocalizedStringList field) {
        return field == null ? Map.of() : field.values();
    }

    /** Converte mapa recebido em DTO de criação/edição admin para o VO. */
    public LocalizedString fromMap(Map<String, String> map) {
        return (map == null || map.isEmpty()) ? LocalizedString.empty() : LocalizedString.of(map);
    }

    public LocalizedStringList fromListMap(Map<String, List<String>> map) {
        return (map == null || map.isEmpty()) ? LocalizedStringList.empty() : LocalizedStringList.of(map);
    }
}
