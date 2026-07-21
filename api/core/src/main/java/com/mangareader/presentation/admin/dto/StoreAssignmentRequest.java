package com.mangareader.presentation.admin.dto;

import java.util.UUID;

import org.hibernate.validator.constraints.URL;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StoreAssignmentRequest(@NotNull UUID storeId, @NotBlank @URL @Size(max = 500) String url) {}
