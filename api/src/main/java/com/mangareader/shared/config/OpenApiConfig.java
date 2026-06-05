package com.mangareader.shared.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

/**
 * Configuração do SpringDoc OpenAPI (Swagger UI).
 * <p>
 * Acessível em {@code /swagger-ui} quando a aplicação está rodando.
 */
@Configuration
public class OpenApiConfig {
    @Value("${app.name}")
    private String appName;

    @Value("${app.version}")
    private String appVersion;

    @Value("${app.mail.base-url:http://localhost:8080}")
    private String serverUrl;

    @Bean
    @SuppressWarnings("rawtypes")
    public OpenAPI customOpenAPI() {
        var errorSchema = new Schema<>()
                .addProperty("success", new Schema<>().type("boolean").example(false))
                .addProperty("message", new Schema<>().type("string"))
                .addProperty("status", new Schema<>().type("integer"))
                .addProperty("timestamp", new Schema<>().type("string").format("date-time"));

        var errorContent = new Content()
                .addMediaType("application/json", new MediaType().schema(errorSchema));

        return new OpenAPI()
                .info(new Info()
                        .title(appName + " API")
                        .version(appVersion)
                        .description("""
                                API RESTful do Manga Reader.

                                ## Módulos
                                - **Auth**: Registro, login, refresh token, recuperação de senha
                                - **Titles**: Catálogo de mangás com busca e filtros
                                - **Chapters**: Capítulos dos títulos
                                - **Comments**: Comentários em títulos
                                - **Ratings**: Avaliações com estrelas e categorias
                                - **Groups**: Grupos de tradução / scanlation
                                - **Library**: Biblioteca pessoal do usuário
                                - **Events**: Eventos da comunidade
                                - **Forum**: Fórum de discussão
                                - **News**: Notícias da plataforma
                                - **Stores**: Lojas parceiras
                                - **Tags**: Gêneros / categorias

                                ## Autenticação
                                Endpoints protegidos requerem header `Authorization: Bearer <token>`.
                                Obtenha o token via `POST /api/auth/sign-in`.

                                ## Paginação
                                Endpoints de listagem suportam os parâmetros:
                                `page` (0-based), `size` (default 20), `sort`, `direction` (asc/desc).
                                """)
                        .contact(new Contact()
                                .name("Manga Reader Team")
                                .url("https://github.com/ruan/manga-reader"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Desenvolvimento local"),
                        new Server()
                                .url(serverUrl)
                                .description("Servidor configurado")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Token JWT obtido via POST /api/auth/sign-in"))
                        .addResponses("Unauthorized", new ApiResponse()
                                .description("Token ausente ou inválido")
                                .content(errorContent))
                        .addResponses("Forbidden", new ApiResponse()
                                .description("Sem permissão para acessar este recurso")
                                .content(errorContent))
                        .addResponses("NotFound", new ApiResponse()
                                .description("Recurso não encontrado")
                                .content(errorContent))
                        .addResponses("TooManyRequests", new ApiResponse()
                                .description("Limite de requisições excedido")
                                .content(errorContent)))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
