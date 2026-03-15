package com.mangareader.presentation.library.dto;

/**
 * DTO com contagens da biblioteca agrupadas por lista de leitura.
 */
public record LibraryCountsResponse(long lendo, long queroLer, long concluido, long total) {}
