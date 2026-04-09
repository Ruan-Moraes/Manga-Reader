package com.mangareader.infrastructure.security;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangareader.application.auth.port.TokenPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

/**
 * Teste de integração E2E do fluxo de autenticação.
 * <p>
 * Sobe o contexto completo do Spring Boot com H2 (JPA) e TestContainers (MongoDB).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("Auth Security — Integração E2E")
class AuthSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TokenPort tokenPort;

    @Autowired
    private UserRepositoryPort userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String SIGN_UP_URL = "/api/auth/sign-up";
    private static final String SIGN_IN_URL = "/api/auth/sign-in";
    private static final String REFRESH_URL = "/api/auth/refresh";
    private static final String ME_URL = "/api/auth/me";

    private String signUpJson(String name, String email, String password) throws Exception {
        return objectMapper.writeValueAsString(
                java.util.Map.of("name", name, "email", email, "password", password)
        );
    }

    private String signInJson(String email, String password) throws Exception {
        return objectMapper.writeValueAsString(
                java.util.Map.of("email", email, "password", password)
        );
    }

    private String refreshJson(String refreshToken) throws Exception {
        return objectMapper.writeValueAsString(
                java.util.Map.of("refreshToken", refreshToken)
        );
    }

    private JsonNode extractData(MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.get("data");
    }

    // =========================================================================
    // Fluxo Completo (Happy Path)
    // =========================================================================

    @Nested
    @DisplayName("Fluxo Completo (Happy Path)")
    @TestMethodOrder(OrderAnnotation.class)
    class HappyPathTests {

        @Test
        @Order(1)
        @DisplayName("Sign-up deve retornar 201 com tokens e dados do usuario")
        void signUpShouldReturn201WithTokens() throws Exception {
            MvcResult result = mockMvc.perform(post(SIGN_UP_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signUpJson("Ruan Test", "ruan@happypath.com", "senha123")))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                    .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                    .andExpect(jsonPath("$.data.userId", notNullValue()))
                    .andExpect(jsonPath("$.data.name").value("Ruan Test"))
                    .andExpect(jsonPath("$.data.email").value("ruan@happypath.com"))
                    .andExpect(jsonPath("$.data.role").value("MEMBER"))
                    .andReturn();

            JsonNode data = extractData(result);
            assertTrue(tokenPort.isTokenValid(data.get("accessToken").asText()));
            assertTrue(tokenPort.isTokenValid(data.get("refreshToken").asText()));
        }

        @Test
        @Order(2)
        @DisplayName("Usuario deve estar persistido com role MEMBER e senha criptografada")
        void userShouldBePersistedCorrectly() throws Exception {
            // Primeiro, cadastra
            mockMvc.perform(post(SIGN_UP_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(signUpJson("Persisted User", "persisted@test.com", "senha456")));

            User user = userRepository.findByEmail("persisted@test.com").orElse(null);

            assertNotNull(user);
            assertEquals("Persisted User", user.getName());
            assertEquals("persisted@test.com", user.getEmail());
            assertEquals(UserRole.MEMBER, user.getRole());
            assertTrue(passwordEncoder.matches("senha456", user.getPasswordHash()));
            assertNotEquals("senha456", user.getPasswordHash());
        }

        @Test
        @Order(3)
        @DisplayName("Sign-in com credenciais corretas deve retornar 200 com tokens")
        void signInShouldReturn200WithTokens() throws Exception {
            // Cadastra primeiro
            mockMvc.perform(post(SIGN_UP_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(signUpJson("Login User", "login@test.com", "senha789")));

            MvcResult result = mockMvc.perform(post(SIGN_IN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signInJson("login@test.com", "senha789")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                    .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                    .andExpect(jsonPath("$.data.name").value("Login User"))
                    .andExpect(jsonPath("$.data.email").value("login@test.com"))
                    .andExpect(jsonPath("$.data.role").value("MEMBER"))
                    .andReturn();

            JsonNode data = extractData(result);
            assertTrue(tokenPort.isTokenValid(data.get("accessToken").asText()));
        }

        @Test
        @Order(4)
        @DisplayName("GET /me com access token deve retornar dados do usuario")
        void meShouldReturnUserDataWithValidToken() throws Exception {
            // Cadastra e pega o token
            MvcResult signUpResult = mockMvc.perform(post(SIGN_UP_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signUpJson("Me User", "me@test.com", "senha000")))
                    .andReturn();

            String accessToken = extractData(signUpResult).get("accessToken").asText();

            mockMvc.perform(get(ME_URL)
                            .header("Authorization", "Bearer " + accessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Me User"))
                    .andExpect(jsonPath("$.data.email").value("me@test.com"))
                    .andExpect(jsonPath("$.data.role").value("MEMBER"));
        }

        @Test
        @Order(5)
        @DisplayName("Refresh token deve retornar novos tokens")
        void refreshShouldReturnNewTokens() throws Exception {
            // Cadastra e pega o refresh token
            MvcResult signUpResult = mockMvc.perform(post(SIGN_UP_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signUpJson("Refresh User", "refresh@test.com", "senhaRefresh")))
                    .andReturn();

            String refreshToken = extractData(signUpResult).get("refreshToken").asText();

            MvcResult refreshResult = mockMvc.perform(post(REFRESH_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(refreshJson(refreshToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                    .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                    .andReturn();

            JsonNode data = extractData(refreshResult);
            assertTrue(tokenPort.isTokenValid(data.get("accessToken").asText()));
            assertTrue(tokenPort.isTokenValid(data.get("refreshToken").asText()));
        }

        @Test
        @Order(6)
        @DisplayName("Novo access token do refresh deve funcionar no /me")
        void newAccessTokenFromRefreshShouldWorkOnMe() throws Exception {
            MvcResult signUpResult = mockMvc.perform(post(SIGN_UP_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signUpJson("Refresh Me User", "refreshme@test.com", "senhaRM")))
                    .andReturn();

            String refreshToken = extractData(signUpResult).get("refreshToken").asText();

            MvcResult refreshResult = mockMvc.perform(post(REFRESH_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(refreshJson(refreshToken)))
                    .andReturn();

            String newAccessToken = extractData(refreshResult).get("accessToken").asText();

            mockMvc.perform(get(ME_URL)
                            .header("Authorization", "Bearer " + newAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name").value("Refresh Me User"))
                    .andExpect(jsonPath("$.data.email").value("refreshme@test.com"));
        }
    }

    // =========================================================================
    // Erros de Autenticação
    // =========================================================================

    @Nested
    @DisplayName("Erros de Autenticacao")
    class AuthErrorTests {

        @Test
        @DisplayName("Sign-up com email duplicado deve retornar 409")
        void signUpDuplicateEmailShouldReturn409() throws Exception {
            mockMvc.perform(post(SIGN_UP_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(signUpJson("User Dup", "duplicate@test.com", "senha111")));

            mockMvc.perform(post(SIGN_UP_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signUpJson("User Dup 2", "duplicate@test.com", "senha222")))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("Sign-in com senha errada deve retornar 401")
        void signInWrongPasswordShouldReturn401() throws Exception {
            mockMvc.perform(post(SIGN_UP_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(signUpJson("Wrong Pass", "wrongpass@test.com", "senhaCorreta")));

            mockMvc.perform(post(SIGN_IN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signInJson("wrongpass@test.com", "senhaErrada")))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Sign-in com email inexistente deve retornar 401")
        void signInNonExistentEmailShouldReturn401() throws Exception {
            mockMvc.perform(post(SIGN_IN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signInJson("naoexiste@test.com", "qualquerSenha")))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Refresh com token invalido deve retornar 401")
        void refreshInvalidTokenShouldReturn401() throws Exception {
            mockMvc.perform(post(REFRESH_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(refreshJson("token.invalido.aqui")))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("GET /me sem token deve retornar 401")
        void meWithoutTokenShouldFail() throws Exception {
            // /api/auth/me matches /api/auth/** (permitAll), mas o controller
            // recebe null Authentication → SecurityExceptionHandler retorna 401.
            mockMvc.perform(get(ME_URL))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("GET /me com token malformado deve retornar 401")
        void meWithMalformedTokenShouldFail() throws Exception {
            // Token malformado é ignorado pelo JwtAuthenticationFilter → sem auth context.
            // SecurityExceptionHandler retorna 401.
            mockMvc.perform(get(ME_URL)
                            .header("Authorization", "Bearer token.malformado.xyz"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // =========================================================================
    // Validação de Claims JWT
    // =========================================================================

    @Nested
    @DisplayName("Validacao de Claims JWT")
    class JwtClaimsTests {

        @Test
        @DisplayName("Access token deve conter userId, email, role e type null")
        void accessTokenShouldHaveCorrectClaims() throws Exception {
            MvcResult result = mockMvc.perform(post(SIGN_UP_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signUpJson("Claims User", "claims@test.com", "senhaClaims")))
                    .andReturn();

            JsonNode data = extractData(result);
            String accessToken = data.get("accessToken").asText();
            String userId = data.get("userId").asText();

            assertEquals(java.util.UUID.fromString(userId), tokenPort.extractUserId(accessToken));
            assertEquals("claims@test.com", tokenPort.extractEmail(accessToken));
            assertEquals("MEMBER", tokenPort.extractRole(accessToken));
            assertEquals(null, tokenPort.extractType(accessToken));
        }

        @Test
        @DisplayName("Refresh token deve conter userId e type=refresh")
        void refreshTokenShouldHaveCorrectClaims() throws Exception {
            MvcResult result = mockMvc.perform(post(SIGN_UP_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(signUpJson("Refresh Claims", "refreshclaims@test.com", "senhaRC")))
                    .andReturn();

            JsonNode data = extractData(result);
            String refreshToken = data.get("refreshToken").asText();
            String userId = data.get("userId").asText();

            assertEquals(java.util.UUID.fromString(userId), tokenPort.extractUserId(refreshToken));
            assertEquals("refresh", tokenPort.extractType(refreshToken));
        }
    }

    // =========================================================================
    // Endpoints Públicos vs Protegidos
    // =========================================================================

    @Nested
    @DisplayName("Endpoints Publicos vs Protegidos")
    class PublicVsProtectedTests {

        @Test
        @DisplayName("GET /api/titles sem token deve retornar 200 (publico)")
        void publicEndpointShouldBeAccessibleWithoutToken() throws Exception {
            mockMvc.perform(get("/api/titles"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("POST /api/ratings sem token deve retornar 401 (protegido)")
        void protectedEndpointShouldRequireToken() throws Exception {
            mockMvc.perform(post("/api/ratings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
