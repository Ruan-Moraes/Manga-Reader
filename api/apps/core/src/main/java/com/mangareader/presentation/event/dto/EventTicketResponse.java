package com.mangareader.presentation.event.dto;

/**
 * DTO de ticket do evento. Preço em centavos (inteiro) + moeda ISO 4217;
 * formatação localizada fica no frontend.
 */
public record EventTicketResponse(
        String id,
        String name,
        long priceInCents,
        String currency,
        int available
) {}
