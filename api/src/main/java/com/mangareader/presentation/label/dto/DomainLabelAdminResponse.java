package com.mangareader.presentation.label.dto;

import java.util.Map;

/**
 * DTO admin de label de domínio — expõe todas as traduções para edição multilíngue.
 */
public record DomainLabelAdminResponse(String value, Map<String, String> labelI18n) {}
