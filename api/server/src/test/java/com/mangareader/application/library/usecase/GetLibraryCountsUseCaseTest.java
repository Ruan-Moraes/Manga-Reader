package com.mangareader.application.library.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.domain.library.valueobject.ReadingListType;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetLibraryCountsUseCase")
class GetLibraryCountsUseCaseTest {

    @Mock
    private LibraryRepositoryPort libraryRepository;

    @InjectMocks
    private GetLibraryCountsUseCase useCase;

    private final UUID USER_ID = UUID.randomUUID();

    @Test
    @DisplayName("Deve retornar contagens agrupadas por lista de leitura")
    void deveRetornarContagens() {
        when(libraryRepository.countByUserIdAndList(USER_ID, ReadingListType.LENDO)).thenReturn(5L);
        when(libraryRepository.countByUserIdAndList(USER_ID, ReadingListType.QUERO_LER)).thenReturn(3L);
        when(libraryRepository.countByUserIdAndList(USER_ID, ReadingListType.CONCLUIDO)).thenReturn(7L);

        var counts = useCase.execute(USER_ID);

        assertThat(counts.lendo()).isEqualTo(5);
        assertThat(counts.queroLer()).isEqualTo(3);
        assertThat(counts.concluido()).isEqualTo(7);
        assertThat(counts.total()).isEqualTo(15);
    }

    @Test
    @DisplayName("Deve retornar zeros para biblioteca vazia")
    void deveRetornarZerosParaBibliotecaVazia() {
        when(libraryRepository.countByUserIdAndList(USER_ID, ReadingListType.LENDO)).thenReturn(0L);
        when(libraryRepository.countByUserIdAndList(USER_ID, ReadingListType.QUERO_LER)).thenReturn(0L);
        when(libraryRepository.countByUserIdAndList(USER_ID, ReadingListType.CONCLUIDO)).thenReturn(0L);

        var counts = useCase.execute(USER_ID);

        assertThat(counts.lendo()).isZero();
        assertThat(counts.queroLer()).isZero();
        assertThat(counts.concluido()).isZero();
        assertThat(counts.total()).isZero();
    }
}
