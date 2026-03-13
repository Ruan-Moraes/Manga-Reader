package com.mangareader.infrastructure.security.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

/**
 * Teste de integração E2E para o fluxo completo de autenticação.
 * <p>
 * Valida: sign-up → sign-in → acesso protegido → refresh token → acesso negado sem token.
 * <p>
 * Usa H2 in-memory para PostgreSQL (via application-test.yml) e TestContainers para MongoDB.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@DisplayName("Auth Flow — Integração E2E")
class AuthFlowIntegrationTest {

    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:8.0");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserJpaRepository userJpaRepository;

    @BeforeEach
    void setUp() {
        userJpaRepository.deleteAll();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private MvcResult signUp(String name, String email, String password) throws Exception {
        var body = """
                {"name": "%s", "email": "%s", "password": "%s"}
                """.formatted(name, email, password);

        return mockMvc.perform(post("/api/auth/sign-up")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andReturn();
    }

    private MvcResult signIn(String email, String password) throws Exception {
        var body = """
                {"email": "%s", "password": "%s"}
                """.formatted(email, password);

        return mockMvc.perform(post("/api/auth/sign-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andReturn();
    }

    private MvcResult refreshToken(String refreshToken) throws Exception {
        var body = """
                {"refreshToken": "%s"}
                """.formatted(refreshToken);

        return mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andReturn();
    }

    private MvcResult getMe(String accessToken) throws Exception {
        return mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andReturn();
    }

    private JsonNode extractData(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Sign Up")
    class SignUp {

        @Test
        @DisplayName("Deve cadastrar novo usuário e retornar tokens JWT")
        void deveCadastrarNovoUsuario() throws Exception {
            var result = signUp("Ruan", "ruan@test.com", "senha123");

            assertThat(result.getResponse().getStatus()).isEqualTo(201);

            var data = extractData(result);
            assertThat(data.get("accessToken").asText()).isNotEmpty();
            assertThat(data.get("refreshToken").asText()).isNotEmpty();
            assertThat(data.get("userId").asText()).isNotEmpty();
            assertThat(data.get("name").asText()).isEqualTo("Ruan");
            assertThat(data.get("email").asText()).isEqualTo("ruan@test.com");
            assertThat(data.get("role").asText()).isEqualTo("MEMBER");
        }

        @Test
        @DisplayName("Deve rejeitar cadastro com email duplicado")
        void deveRejeitarEmailDuplicado() throws Exception {
            signUp("Ruan", "ruan@test.com", "senha123");

            var result = signUp("Outro", "ruan@test.com", "outrasenha");

            assertThat(result.getResponse().getStatus()).isEqualTo(409);
        }

        @Test
        @DisplayName("Deve rejeitar cadastro com dados inválidos")
        void deveRejeitarDadosInvalidos() throws Exception {
            mockMvc.perform(post("/api/auth/sign-up")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "", "email": "invalid", "password": "12"}
                                    """))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Sign In")
    class SignIn {

        @BeforeEach
        void createUser() throws Exception {
            signUp("Ruan", "ruan@test.com", "senha123");
        }

        @Test
        @DisplayName("Deve autenticar com credenciais válidas")
        void deveAutenticarComCredenciaisValidas() throws Exception {
            var result = signIn("ruan@test.com", "senha123");

            assertThat(result.getResponse().getStatus()).isEqualTo(200);

            var data = extractData(result);
            assertThat(data.get("accessToken").asText()).isNotEmpty();
            assertThat(data.get("refreshToken").asText()).isNotEmpty();
            assertThat(data.get("email").asText()).isEqualTo("ruan@test.com");
        }

        @Test
        @DisplayName("Deve rejeitar senha incorreta")
        void deveRejeitarSenhaIncorreta() throws Exception {
            var result = signIn("ruan@test.com", "senhaerrada");

            assertThat(result.getResponse().getStatus()).isEqualTo(401);
        }

        @Test
        @DisplayName("Deve rejeitar email inexistente")
        void deveRejeitarEmailInexistente() throws Exception {
            var result = signIn("naoexiste@test.com", "senha123");

            assertThat(result.getResponse().getStatus()).isEqualTo(401);
        }
    }

    @Nested
    @DisplayName("Rota Protegida (GET /api/auth/me)")
    class ProtectedRoute {

        @Test
        @DisplayName("Deve retornar dados do usuário com access token válido")
        void deveRetornarDadosComTokenValido() throws Exception {
            var signUpResult = signUp("Ruan", "ruan@test.com", "senha123");
            var accessToken = extractData(signUpResult).get("accessToken").asText();

            var meResult = getMe(accessToken);

            assertThat(meResult.getResponse().getStatus()).isEqualTo(200);

            var data = extractData(meResult);
            assertThat(data.get("name").asText()).isEqualTo("Ruan");
            assertThat(data.get("email").asText()).isEqualTo("ruan@test.com");
            assertThat(data.get("role").asText()).isEqualTo("MEMBER");
        }

        @Test
        @DisplayName("Deve retornar 401 sem token")
        void deveRetornar401SemToken() throws Exception {
            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH_UNAUTHENTICATED"));
        }

        @Test
        @DisplayName("Deve retornar 401 com token inválido")
        void deveRetornar401ComTokenInvalido() throws Exception {
            mockMvc.perform(get("/api/auth/me")
                            .header("Authorization", "Bearer token.invalido.xyz"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Deve rejeitar acesso com refresh token (não é access token)")
        void deveRejeitarAcessoComRefreshToken() throws Exception {
            var signUpResult = signUp("Ruan", "ruan@test.com", "senha123");
            var refreshToken = extractData(signUpResult).get("refreshToken").asText();

            mockMvc.perform(get("/api/auth/me")
                            .header("Authorization", "Bearer " + refreshToken))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Refresh Token")
    class RefreshTokenFlow {

        @Test
        @DisplayName("Deve renovar tokens com refresh token válido")
        void deveRenovarTokensComRefreshTokenValido() throws Exception {
            var signUpResult = signUp("Ruan", "ruan@test.com", "senha123");
            var refreshToken = extractData(signUpResult).get("refreshToken").asText();

            var refreshResult = refreshToken(refreshToken);

            assertThat(refreshResult.getResponse().getStatus()).isEqualTo(200);

            var data = extractData(refreshResult);
            assertThat(data.get("accessToken").asText()).isNotEmpty();
            assertThat(data.get("refreshToken").asText()).isNotEmpty();
        }

        @Test
        @DisplayName("Novo access token deve permitir acesso a rota protegida")
        void novoAccessTokenDevePermitirAcesso() throws Exception {
            var signUpResult = signUp("Ruan", "ruan@test.com", "senha123");
            var refreshToken = extractData(signUpResult).get("refreshToken").asText();

            var refreshResult = refreshToken(refreshToken);
            var newAccessToken = extractData(refreshResult).get("accessToken").asText();

            var meResult = getMe(newAccessToken);
            assertThat(meResult.getResponse().getStatus()).isEqualTo(200);

            var data = extractData(meResult);
            assertThat(data.get("email").asText()).isEqualTo("ruan@test.com");
        }

        @Test
        @DisplayName("Deve rejeitar refresh token inválido")
        void deveRejeitarRefreshTokenInvalido() throws Exception {
            var result = refreshToken("token.invalido.xyz");

            assertThat(result.getResponse().getStatus()).isEqualTo(401);
        }
    }

    @Nested
    @DisplayName("Fluxo Completo E2E")
    class FullFlow {

        @Test
        @DisplayName("sign-up → sign-in → me → refresh → me (novo token)")
        void fluxoCompletoDeAutenticacao() throws Exception {
            // 1. Sign Up
            var signUpResult = signUp("Ruan", "ruan@test.com", "senha123");
            assertThat(signUpResult.getResponse().getStatus()).isEqualTo(201);

            // 2. Sign In com as mesmas credenciais
            var signInResult = signIn("ruan@test.com", "senha123");
            assertThat(signInResult.getResponse().getStatus()).isEqualTo(200);

            var signInData = extractData(signInResult);
            var accessToken = signInData.get("accessToken").asText();
            var refreshToken = signInData.get("refreshToken").asText();

            // 3. Acessar rota protegida com access token
            var meResult = getMe(accessToken);
            assertThat(meResult.getResponse().getStatus()).isEqualTo(200);
            assertThat(extractData(meResult).get("name").asText()).isEqualTo("Ruan");

            // 4. Renovar tokens com refresh token
            var refreshResult = refreshToken(refreshToken);
            assertThat(refreshResult.getResponse().getStatus()).isEqualTo(200);

            var newAccessToken = extractData(refreshResult).get("accessToken").asText();

            // 5. Acessar rota protegida com novo access token
            var meResult2 = getMe(newAccessToken);
            assertThat(meResult2.getResponse().getStatus()).isEqualTo(200);
            assertThat(extractData(meResult2).get("email").asText()).isEqualTo("ruan@test.com");
        }
    }

    @Nested
    @DisplayName("Endpoints públicos vs protegidos")
    class PublicVsProtected {

        @Test
        @DisplayName("Endpoints públicos devem ser acessíveis sem token")
        void endpointsPublicosDevemSerAcessiveis() throws Exception {
            // GET /api/titles é público
            mockMvc.perform(get("/api/tags"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("POST em endpoint protegido deve retornar 401 sem token")
        void postProtegidoDeveRetornar401() throws Exception {
            mockMvc.perform(post("/api/library")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"titleId": "some-id"}
                                    """))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Forgot / Reset Password")
    class ForgotResetPassword {

        @Test
        @DisplayName("Deve retornar mensagem genérica para forgot-password (email existente ou não)")
        void deveRetornarMensagemGenerica() throws Exception {
            // Mesmo sem usuário cadastrado, deve retornar 200
            mockMvc.perform(post("/api/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email": "naoexiste@test.com"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Deve rejeitar reset-password com token inválido")
        void deveRejeitarResetComTokenInvalido() throws Exception {
            mockMvc.perform(post("/api/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"token": "token.invalido", "newPassword": "novaSenha123"}
                                    """))
                    .andExpect(status().isUnauthorized());
        }
    }
}
