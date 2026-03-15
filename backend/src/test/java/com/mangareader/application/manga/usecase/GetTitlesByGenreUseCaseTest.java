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
@DisplayName("GetTitlesByGenreUseCase")
class GetTitlesByGenreUseCaseTest {
    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private GetTitlesByGenreUseCase getTitlesByGenreUseCase;

    @Test
    @DisplayName("Deve retornar página de títulos filtrados por gênero")
    void deveRetornarTitulosFiltradosPorGenero() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        List<Title> titles = List.of(
                Title.builder().id("1").name("Naruto").genres(List.of("Ação", "Aventura")).build(),
                Title.builder().id("2").name("Dragon Ball").genres(List.of("Ação", "Comédia")).build()
        );

        Page<Title> page = new PageImpl<>(titles, pageable, 2);

        when(titleRepository.findByGenresContaining("Ação", pageable)).thenReturn(page);

        // Act
        Page<Title> result = getTitlesByGenreUseCase.execute("Ação", pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allSatisfy(title ->
                assertThat(title.getGenres()).contains("Ação")
        );

        verify(titleRepository).findByGenresContaining("Ação", pageable);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando nenhum título possui o gênero")
    void deveRetornarPaginaVaziaQuandoNenhumTituloPossuiGenero() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        Page<Title> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(titleRepository.findByGenresContaining("Terror", pageable)).thenReturn(emptyPage);

        // Act
        Page<Title> result = getTitlesByGenreUseCase.execute("Terror", pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
    }
}
