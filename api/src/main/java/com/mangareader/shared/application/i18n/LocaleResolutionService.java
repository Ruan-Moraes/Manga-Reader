package com.mangareader.shared.application.i18n;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.config.I18nConfig;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

import lombok.RequiredArgsConstructor;

/**
 * Serviço central de resolução de conteúdo multilíngue.
 *
 * <p>Encapsula o acesso ao {@link LocaleContextHolder} para que mappers e
 * use cases não dependam diretamente do contexto Spring de locale, e garante
 * que a regra de fallback fique em um único ponto do sistema.
 *
 * <p>Para conteúdo de catálogo, sempre delega para {@link LocalizedString#resolve(Locale)}
 * (cadeia de fallback com pt-BR).
 *
 * <p>Para UGC, este serviço expõe {@link #currentLanguageTag()} — usado pelos
 * use cases de criação para gravar o idioma ativo no momento do post.
 */
@Service
@RequiredArgsConstructor
public class LocaleResolutionService {
    private final UserRepositoryPort userRepository;

    public Locale currentLocale() {
        return LocaleContextHolder.getLocale();
    }

    public String currentLanguageTag() {
        return currentLocale().toLanguageTag();
    }

    /**
     * Cadeia ordenada de locales para resolução de conteúdo (catálogo, UGC).
     * Autenticado → preferência do user; anônimo → Accept-Language; sempre cai no default.
     */
    public List<Locale> currentContentLocales() {
        Set<Locale> chain = new LinkedHashSet<>();

        userIdFromContext()
                .flatMap(userRepository::findById)
                .map(User::getContentLocales)
                .ifPresent(tags -> tags.forEach(tag -> {
                    Locale loc = Locale.forLanguageTag(tag);
                    if (!loc.toLanguageTag().isEmpty() && !"und".equals(loc.toLanguageTag())) {
                        chain.add(loc);
                    }
                }));

        chain.add(currentLocale());
        chain.add(I18nConfig.DEFAULT_LOCALE);

        return new ArrayList<>(chain);
    }

    public List<String> currentContentLanguageTags() {
        return currentContentLocales().stream().map(Locale::toLanguageTag).toList();
    }

    private static Optional<UUID> userIdFromContext() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = auth.getPrincipal();

        if (principal instanceof UUID uuid) {
            return Optional.of(uuid);
        }

        if (principal instanceof String s) {
            try {
                return Optional.of(UUID.fromString(s));
            } catch (IllegalArgumentException ignored) {
                return Optional.empty();
            }
        }

        return Optional.empty();
    }

    public String resolve(LocalizedString field) {
        if (field == null) {
            return "";
        }

        for (Locale loc : currentContentLocales()) {
            String hit = field.resolveOrNull(loc);

            if (hit != null) {
                return hit;
            }
        }

        return field.resolve(currentLocale());
    }

    public List<String> resolve(LocalizedStringList field) {
        if (field == null) {
            return List.of();
        }

        return field.resolve(currentLocale());
    }
}
