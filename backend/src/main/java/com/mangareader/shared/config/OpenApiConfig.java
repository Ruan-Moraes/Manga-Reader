package com.mangareader.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
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

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title(appName + " API")
                        .version(appVersion)
                        .description("""
                                API RESTful do Manga Reader.

                                Domínios: Auth, Titles, Chapters, Comments, Ratings,
                                Groups, Library, Events, Forum, News, Stores.
                                """)
                        .contact(new Contact()
                                .name("Manga Reader Team")
                                .url("https://github.com/ruan/manga-reader")))
                .addServersItem(new Server()
                        .url("http://localhost:8080")
                        .description("Desenvolvimento local"))
                .schemaRequirement("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Token JWT obtido via POST /api/auth/sign-in"));
    }
}
