package com.mangareader.application.manga.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
@DisplayName("ListAdminTitlesUseCase")
class ListAdminTitlesUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private ListAdminTitlesUseCase useCase;

    private final Pageable pageable = PageRequest.of(0, 20);
    private final Page<Title> page = new PageImpl<>(java.util.List.of());

    @Test
    @DisplayName("Sem busca usa findAll")
    void semBuscaUsaFindAll() {
        when(titleRepository.findAll(pageable)).thenReturn(page);

        assertThat(useCase.execute(null, pageable)).isSameAs(page);

        verify(titleRepository).findAll(pageable);
    }

    @Test
    @DisplayName("Com busca usa searchByName")
    void comBuscaUsaSearch() {
        when(titleRepository.searchByName("naruto", pageable)).thenReturn(page);

        assertThat(useCase.execute("naruto", pageable)).isSameAs(page);

        verify(titleRepository).searchByName("naruto", pageable);
    }
}
