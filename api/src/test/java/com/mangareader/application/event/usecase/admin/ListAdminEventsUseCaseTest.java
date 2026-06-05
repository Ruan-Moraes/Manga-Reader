package com.mangareader.application.event.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
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

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;

@ExtendWith(MockitoExtension.class)
@DisplayName("ListAdminEventsUseCase")
class ListAdminEventsUseCaseTest {

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private ListAdminEventsUseCase useCase;

    private final Pageable pageable = PageRequest.of(0, 20);
    private final Page<Event> page = new PageImpl<>(java.util.List.of());

    @Test
    @DisplayName("Sem busca usa findAll")
    void semBuscaUsaFindAll() {
        when(eventRepository.findAll(pageable)).thenReturn(page);

        assertThat(useCase.execute(null, pageable)).isSameAs(page);

        verify(eventRepository).findAll(pageable);
        verifyNoMoreInteractions(eventRepository);
    }

    @Test
    @DisplayName("Com busca usa searchByTitle")
    void comBuscaUsaSearch() {
        when(eventRepository.searchByTitle("expo", pageable)).thenReturn(page);

        assertThat(useCase.execute("expo", pageable)).isSameAs(page);

        verify(eventRepository).searchByTitle("expo", pageable);
        verifyNoMoreInteractions(eventRepository);
    }

    @Test
    @DisplayName("Busca em branco cai em findAll")
    void buscaEmBrancoFindAll() {
        when(eventRepository.findAll(pageable)).thenReturn(page);

        useCase.execute("   ", pageable);

        verify(eventRepository).findAll(pageable);
    }
}
