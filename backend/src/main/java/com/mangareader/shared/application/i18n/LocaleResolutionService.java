package com.mangareader.shared.application.i18n;

import java.util.List;
import java.util.Locale;

import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

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
public class LocaleResolutionService {
    public Locale currentLocale() {
        return LocaleContextHolder.getLocale();
    }

    public String currentLanguageTag() {
        return currentLocale().toLanguageTag();
    }

    public String resolve(LocalizedString field) {
        if (field == null) {
            return "";
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
