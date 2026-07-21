package com.mangareader.infrastructure.security.jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("JwtTokenProvider")
class JwtTokenProviderTest {

    private static final String SECRET = "manga-reader-test-secret-key-for-jwt-signing-minimum-256-bits";
    private static final long ACCESS_EXPIRATION = 3_600_000L;   // 1 hora
    private static final long REFRESH_EXPIRATION = 86_400_000L; // 24 horas
    private static final long PASSWORD_RESET_EXPIRATION = Duration.ofMinutes(30).toMillis();

    private JwtTokenProvider provider;
    private final UUID USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider(SECRET, ACCESS_EXPIRATION, REFRESH_EXPIRATION);
    }

    @Nested
    @DisplayName("generateAccessToken")
    class GenerateAccessToken {

        @Test
        @DisplayName("Deve gerar token não nulo e não vazio")
        void deveGerarTokenValido() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");

            assertThat(token).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("Token gerado deve conter 3 partes separadas por ponto (formato JWT)")
        void deveGerarTokenNoFormatoJwt() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");

            assertThat(token.split("\\.")).hasSize(3);
        }

        @Test
        @DisplayName("Access token deve declarar type=access")
        void deveDeclararTipoAccess() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");

            assertThat(provider.extractType(token)).isEqualTo("access");
        }
    }

    @Nested
    @DisplayName("generateRefreshToken")
    class GenerateRefreshToken {
        @Test
        @DisplayName("Emissões no mesmo segundo devem ter jti UUID e JWT distintos")
        void emissoesNoMesmoSegundoSaoUnicas() {
            String first = provider.generateRefreshToken(USER_ID);
            String second = provider.generateRefreshToken(USER_ID);

            assertThat(first).isNotEqualTo(second);
            assertThat(UUID.fromString(provider.extractTokenId(first)))
                    .isNotEqualTo(UUID.fromString(provider.extractTokenId(second)));
        }

        @Test
        @DisplayName("Emissões concorrentes devem ser únicas")
        void emissoesConcorrentesSaoUnicas() throws Exception {
            try (var executor = Executors.newFixedThreadPool(8)) {
                var tasks = IntStream.range(0, 64)
                        .mapToObj(ignored -> (Callable<String>) () -> provider.generateRefreshToken(USER_ID))
                        .toList();

                var tokens = executor.invokeAll(tasks).stream()
                        .map(future -> {
                            try {
                                return future.get();
                            } catch (Exception e) {
                                throw new IllegalStateException(e);
                            }
                        })
                        .toList();

                assertThat(tokens).doesNotHaveDuplicates();
                assertThat(tokens.stream().map(provider::extractTokenId).toList())
                        .doesNotHaveDuplicates();
            }
        }

        @Test
        @DisplayName("Instâncias distintas devem emitir jti diferentes")
        void instanciasDistintasSaoUnicas() {
            var otherInstance = new JwtTokenProvider(SECRET, ACCESS_EXPIRATION, REFRESH_EXPIRATION);

            String first = provider.generateRefreshToken(USER_ID);
            String second = otherInstance.generateRefreshToken(USER_ID);

            assertThat(first).isNotEqualTo(second);
            assertThat(provider.extractTokenId(first)).isNotEqualTo(otherInstance.extractTokenId(second));
        }
    }

    @Nested
    @DisplayName("extractExpiration")
    class ExtractExpiration {

        @Test
        @DisplayName("Deve extrair a expiração do refresh token (~24h à frente)")
        void deveExtrairExpiracaoDoRefreshToken() {
            String token = provider.generateRefreshToken(USER_ID);

            LocalDateTime expiration = provider.extractExpiration(token);

            // JWT trunca exp para segundos — tolerância de 5s cobre o arredondamento
            LocalDateTime expected = LocalDateTime.now().plusHours(24);
            assertThat(expiration).isCloseTo(expected, within(5, ChronoUnit.SECONDS));
        }
    }

    @Nested
    @DisplayName("extractUserId")
    class ExtractUserId {

        @Test
        @DisplayName("Deve extrair o userId corretamente do token de acesso")
        void deveExtrairUserIdDoToken() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");

            UUID extracted = provider.extractUserId(token);

            assertThat(extracted).isEqualTo(USER_ID);
        }

        @Test
        @DisplayName("Deve extrair o userId corretamente do refresh token")
        void deveExtrairUserIdDoRefreshToken() {
            String token = provider.generateRefreshToken(USER_ID);

            UUID extracted = provider.extractUserId(token);

            assertThat(extracted).isEqualTo(USER_ID);
        }
    }

    @Nested
    @DisplayName("extractEmail")
    class ExtractEmail {

        @Test
        @DisplayName("Deve extrair o email corretamente do token de acesso")
        void deveExtrairEmailDoToken() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");

            String email = provider.extractEmail(token);

            assertThat(email).isEqualTo("ruan@email.com");
        }
    }

    @Nested
    @DisplayName("extractRole")
    class ExtractRole {

        @Test
        @DisplayName("Deve extrair o role corretamente do token de acesso")
        void deveExtrairRoleDoToken() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "ADMIN");

            String role = provider.extractRole(token);

            assertThat(role).isEqualTo("ADMIN");
        }
    }

    @Nested
    @DisplayName("extractType")
    class ExtractType {

        @Test
        @DisplayName("Deve retornar 'refresh' para refresh token")
        void deveRetornarTipoRefresh() {
            String token = provider.generateRefreshToken(USER_ID);

            assertThat(provider.extractType(token)).isEqualTo("refresh");
        }

        @Test
        @DisplayName("Deve retornar 'password_reset' para token de reset")
        void deveRetornarTipoPasswordReset() {
            String token = provider.generatePasswordResetToken(USER_ID, "ruan@email.com", "password-hash");

            assertThat(provider.extractType(token)).isEqualTo("password_reset");
        }

        @Test
        @DisplayName("Deve retornar 'access' para access token")
        void deveRetornarAccessParaAccessToken() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");

            assertThat(provider.extractType(token)).isEqualTo("access");
        }
    }

    @Nested
    @DisplayName("isTokenValid")
    class IsTokenValid {

        @Test
        @DisplayName("Deve retornar true para token de acesso válido")
        void deveRetornarTrueParaTokenValido() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");

            assertThat(provider.isTokenValid(token)).isTrue();
        }

        @Test
        @DisplayName("Deve retornar true para refresh token válido")
        void deveRetornarTrueParaRefreshTokenValido() {
            String token = provider.generateRefreshToken(USER_ID);

            assertThat(provider.isTokenValid(token)).isTrue();
        }

        @Test
        @DisplayName("Deve retornar false para token com assinatura inválida")
        void deveRetornarFalseParaAssinaturaInvalida() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");
            String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "assinaturaInvalida";

            assertThat(provider.isTokenValid(tampered)).isFalse();
        }

        @Test
        @DisplayName("Deve retornar false para string aleatória")
        void deveRetornarFalseParaStringAleatoria() {
            assertThat(provider.isTokenValid("nao.e.um.jwt.valido")).isFalse();
        }

        @Test
        @DisplayName("Deve retornar false para string vazia")
        void deveRetornarFalseParaStringVazia() {
            assertThat(provider.isTokenValid("")).isFalse();
        }

        @Test
        @DisplayName("Deve retornar false para token expirado")
        void deveRetornarFalseParaTokenExpirado() {
            // Cria um provider com expiração de -1ms (já expirado)
            JwtTokenProvider expiredProvider = new JwtTokenProvider(SECRET, -1L, -1L);
            String token = expiredProvider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");

            assertThat(provider.isTokenValid(token)).isFalse();
        }
    }

    @Nested
    @DisplayName("generatePasswordResetToken")
    class GeneratePasswordResetToken {

        @Test
        @DisplayName("Deve gerar token de reset com email e tipo corretos")
        void deveGerarTokenDeResetComEmailETipo() {
            String token = provider.generatePasswordResetToken(USER_ID, "ruan@email.com", "password-hash");

            assertThat(provider.extractEmail(token)).isEqualTo("ruan@email.com");
            assertThat(provider.extractType(token)).isEqualTo("password_reset");
            assertThat(provider.extractUserId(token)).isEqualTo(USER_ID);
        }

        @Test
        @DisplayName("Token de reset deve usar exatamente a validade configurada")
        void tokenDeResetDeveUsarValidadeConfigurada() {
            Instant now = Instant.parse("2026-07-18T15:00:00Z");
            Clock clock = Clock.fixed(now, ZoneId.of("UTC"));
            JwtTokenProvider fixedProvider = new JwtTokenProvider(
                    SECRET, ACCESS_EXPIRATION, REFRESH_EXPIRATION, PASSWORD_RESET_EXPIRATION, clock
            );

            String token = fixedProvider.generatePasswordResetToken(USER_ID, "ruan@email.com", "password-hash");

            assertThat(fixedProvider.extractExpiration(token))
                    .isEqualTo(LocalDateTime.ofInstant(now.plus(Duration.ofMinutes(30)), ZoneId.systemDefault()));
            assertThat(fixedProvider.passwordResetExpiration()).isEqualTo(Duration.ofMinutes(30));
        }

        @Test
        void tokenStopsMatchingAfterThePasswordHashChanges() {
            String token = provider.generatePasswordResetToken(
                    USER_ID, "ruan@email.com", "old-password-hash");

            assertThat(provider.matchesPasswordState(token, "old-password-hash")).isTrue();
            assertThat(provider.matchesPasswordState(token, "new-password-hash")).isFalse();
            assertThat(provider.extractTokenId(token)).isNotBlank();
        }
    }
}
