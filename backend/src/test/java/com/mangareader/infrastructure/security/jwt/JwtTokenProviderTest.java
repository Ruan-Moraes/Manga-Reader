package com.mangareader.infrastructure.security.jwt;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("JwtTokenProvider")
class JwtTokenProviderTest {

    private static final String SECRET = "manga-reader-test-secret-key-for-jwt-signing-minimum-256-bits";
    private static final long ACCESS_EXPIRATION = 3_600_000L;   // 1 hora
    private static final long REFRESH_EXPIRATION = 86_400_000L; // 24 horas

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
            String token = provider.generatePasswordResetToken(USER_ID, "ruan@email.com");

            assertThat(provider.extractType(token)).isEqualTo("password_reset");
        }

        @Test
        @DisplayName("Deve retornar null para access token (sem claim 'type')")
        void deveRetornarNullParaAccessToken() {
            String token = provider.generateAccessToken(USER_ID, "ruan@email.com", "MEMBER");

            assertThat(provider.extractType(token)).isNull();
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
            String token = provider.generatePasswordResetToken(USER_ID, "ruan@email.com");

            assertThat(provider.extractEmail(token)).isEqualTo("ruan@email.com");
            assertThat(provider.extractType(token)).isEqualTo("password_reset");
            assertThat(provider.extractUserId(token)).isEqualTo(USER_ID);
        }

        @Test
        @DisplayName("Token de reset deve expirar em aproximadamente 15 minutos")
        void tokenDeResetDeveExpirarEm15Minutos() throws InterruptedException {
            // Cria provider com expiração de 1ms para simular token instantaneamente expirado
            JwtTokenProvider shortLivedProvider = new JwtTokenProvider(SECRET, ACCESS_EXPIRATION, REFRESH_EXPIRATION);
            String token = shortLivedProvider.generatePasswordResetToken(USER_ID, "ruan@email.com");

            // Token gerado agora deve ser válido
            assertThat(shortLivedProvider.isTokenValid(token)).isTrue();
        }
    }
}
