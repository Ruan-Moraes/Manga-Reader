package com.mangareader.application.errorlog.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.errorlog.port.ErrorLogRepositoryPort;
import com.mangareader.application.errorlog.usecase.CreateErrorLogUseCase.CreateErrorLogInput;
import com.mangareader.domain.errorlog.entity.ErrorLog;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateErrorLogUseCase")
class CreateErrorLogUseCaseTest {
    @Mock
    private ErrorLogRepositoryPort errorLogRepository;

    @InjectMocks
    private CreateErrorLogUseCase useCase;

    @Test
    @DisplayName("Deve criar error log com todos os campos")
    void deveCriarErrorLogComTodosCampos() {
        var input = new CreateErrorLogInput(
                "TypeError: x is not a function",
                "TypeError: x is not a function\n    at render",
                "error-boundary",
                "/Manga-Reader/titles/1",
                "Mozilla/5.0",
                "user-123"
        );

        when(errorLogRepository.save(any(ErrorLog.class)))
                .thenAnswer(invocation -> {
                    ErrorLog saved = invocation.getArgument(0);
                    saved.setId("generated-id");
                    return saved;
                });

        ErrorLog result = useCase.execute(input);

        assertThat(result.getId()).isEqualTo("generated-id");
        assertThat(result.getMessage()).isEqualTo("TypeError: x is not a function");
        assertThat(result.getStackTrace()).contains("at render");
        assertThat(result.getSource()).isEqualTo("error-boundary");
        assertThat(result.getUrl()).isEqualTo("/Manga-Reader/titles/1");
        assertThat(result.getUserAgent()).isEqualTo("Mozilla/5.0");
        assertThat(result.getUserId()).isEqualTo("user-123");
    }

    @Test
    @DisplayName("Deve criar error log com campos opcionais nulos")
    void deveCriarComCamposOpcionaisNulos() {
        var input = new CreateErrorLogInput(
                "Script error",
                null,
                "window-error",
                null,
                null,
                null
        );

        when(errorLogRepository.save(any(ErrorLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ErrorLog result = useCase.execute(input);

        assertThat(result.getMessage()).isEqualTo("Script error");
        assertThat(result.getStackTrace()).isNull();
        assertThat(result.getUserId()).isNull();
    }

    @Test
    @DisplayName("Deve delegar save ao repository port")
    void deveDelegarSaveAoPort() {
        var input = new CreateErrorLogInput(
                "Error", "stack", "unhandled-rejection", "/url", "agent", null
        );

        when(errorLogRepository.save(any(ErrorLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        useCase.execute(input);

        ArgumentCaptor<ErrorLog> captor = ArgumentCaptor.forClass(ErrorLog.class);

        verify(errorLogRepository).save(captor.capture());

        ErrorLog captured = captor.getValue();

        assertThat(captured.getMessage()).isEqualTo("Error");
        assertThat(captured.getSource()).isEqualTo("unhandled-rejection");
    }
}
