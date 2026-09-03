package com.mangareader.presentation.admin.dto;

import java.time.Instant;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

public record ScheduleNewsRequest(@NotNull @Future Instant scheduledAt) {}
