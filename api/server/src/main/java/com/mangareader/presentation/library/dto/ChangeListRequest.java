package com.mangareader.presentation.library.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request para alterar o tipo de lista de um mangá salvo.
 */
public record ChangeListRequest(
        @NotNull(message = "{validation.library.newList.required}")
        String list
) {}
