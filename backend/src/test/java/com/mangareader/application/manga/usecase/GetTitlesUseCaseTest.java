package com.mangareader.application.manga.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetTitlesUseCase")
class GetTitlesUseCaseTest {
    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private GetTitlesUseCase getTitlesUseCase;

    @Test
    @DisplayName("Deve retornar página de títulos")
    void deveRetornarPaginaDeTitulos() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        List<Title> titles = List.of(
                Title.builder().id("1").name("Naruto").build(),
                Title.builder().id("2").name("One Piece").build()
        );

        Page<Title> page = new PageImpl<>(titles, pageable, 2);

        when(titleRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<Title> result = getTitlesUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
        verify(titleRepository).findAll(pageable);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando não há títulos")
    void deveRetornarPaginaVaziaQuandoNaoHaTitulos() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Title> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(titleRepository.findAll(pageable)).thenReturn(emptyPage);

        // Act
        Page<Title> result = getTitlesUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
