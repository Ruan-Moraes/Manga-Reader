package com.mangareader.presentation.event.dto;

/**
 * DTO de ticket do evento.
 */
public record EventTicketResponse(
        String id,
        String name,
        String price,
        int available
) {}
