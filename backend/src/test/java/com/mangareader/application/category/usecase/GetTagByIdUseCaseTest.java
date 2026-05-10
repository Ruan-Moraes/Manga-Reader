package com.mangareader.application.category.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Locale;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetTagByIdUseCase")
class GetTagByIdUseCaseTest {

    @Mock
    private TagRepositoryPort tagRepository;

    @InjectMocks
    private GetTagByIdUseCase getTagByIdUseCase;

    @Test
    @DisplayName("Deve retornar tag quando encontrada")
    void deveRetornarTagQuandoEncontrada() {
        Long tagId = 1L;
        Tag tag = Tag.builder().id(tagId).label(LocalizedString.ofDefault("Ação")).build();
        when(tagRepository.findById(tagId)).thenReturn(Optional.of(tag));

        Tag result = getTagByIdUseCase.execute(tagId);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(tagId);
        assertThat(result.getLabel().resolve(Locale.forLanguageTag("pt-BR"))).isEqualTo("Ação");
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando tag não existe")
    void deveLancarExcecaoQuandoTagNaoExiste() {
        Long tagId = 999L;
        when(tagRepository.findById(tagId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> getTagByIdUseCase.execute(tagId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
