package com.mangareader.presentation.label.dto;

/**
 * DTO público de label de domínio — compatível com o frontend
 * {@code DomainLabelOption { value: string, label: string }}.
 * <p>
 * O campo {@code label} já é resolvido pelo locale do request (via
 * {@code LocalizedMappingHelper}) antes de ser exposto neste DTO.
 */
public record DomainLabelResponse(String value, String label) {}
