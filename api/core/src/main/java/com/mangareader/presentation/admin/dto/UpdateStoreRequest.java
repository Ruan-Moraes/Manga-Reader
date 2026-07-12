package com.mangareader.presentation.admin.dto;

import java.util.Map;

import com.mangareader.domain.store.valueobject.StoreStatus;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record UpdateStoreRequest(
        Map<String, String> name,
        @URL @Size(max = 255) String website,
        @URL @Size(max = 255) String logo,
        @URL @Size(max = 255) String icon,
        StoreStatus status,
        @Min(0) Integer displayOrder
) {}
