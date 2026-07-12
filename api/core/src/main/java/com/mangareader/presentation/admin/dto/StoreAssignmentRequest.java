package com.mangareader.presentation.admin.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record StoreAssignmentRequest(@NotNull UUID storeId, @NotNull @URL @Size(max = 500) String url) {}
