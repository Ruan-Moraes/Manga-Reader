package com.mangareader.application.library.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserLibraryByListUseCase")
class GetUserLibraryByListUseCaseTest {

    @Mock
    private LibraryRepositoryPort libraryRepository;

    @InjectMocks
    private GetUserLibraryByListUseCase useCase;

    private final UUID USER_ID = UUID.randomUUID();

    @Test
    @DisplayName("Deve delegar ao repositório com userId, list e pageable")
    void deveDelegarAoRepositorio() {
        Pageable pageable = PageRequest.of(0, 10);
        var mangas = List.of(
                SavedManga.builder().titleId("t1").name("One Piece").list(ReadingListType.LENDO).build(),
                SavedManga.builder().titleId("t2").name("Naruto").list(ReadingListType.LENDO).build()
        );
        when(libraryRepository.findByUserIdAndList(USER_ID, ReadingListType.LENDO, pageable))
                .thenReturn(new PageImpl<>(mangas));

        var result = useCase.execute(USER_ID, ReadingListType.LENDO, pageable);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allSatisfy(m ->
                assertThat(m.getList()).isEqualTo(ReadingListType.LENDO));
    }

    @Test
    @DisplayName("Deve retornar página vazia quando lista não tem itens")
    void deveRetornarPaginaVazia() {
        Pageable pageable = PageRequest.of(0, 10);
        when(libraryRepository.findByUserIdAndList(USER_ID, ReadingListType.QUERO_LER, pageable))
                .thenReturn(new PageImpl<>(List.of()));

        var result = useCase.execute(USER_ID, ReadingListType.QUERO_LER, pageable);

        assertThat(result.getContent()).isEmpty();
    }
}
