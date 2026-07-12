package com.mangareader.presentation.admin.dto;

import java.util.Map;

import com.mangareader.domain.store.valueobject.StoreStatus;
import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record CreateStoreRequest(
        @NotNull @RequiredLanguages Map<String, String> name,
        @NotBlank @URL @Size(max = 255) String website,
        @URL @Size(max = 255) String logo,
        @URL @Size(max = 255) String icon,
        @NotNull StoreStatus status,
        @Min(0) int displayOrder
) {}
