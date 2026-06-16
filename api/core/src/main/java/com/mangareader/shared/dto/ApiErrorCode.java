package com.mangareader.shared.dto;

/**
 * Códigos de erro padronizados da API.
 * <p>
 * O backend retorna o código técnico; o frontend mapeia para mensagens amigáveis.
 * <p>
 * Convenção: {@code CATEGORIA_NOME_ESPECIFICO} (UPPER_SNAKE_CASE).
 *
 * <h3>Categorias</h3>
 * <ul>
 *   <li>{@code AUTH_*} — Autenticação e autorização</li>
 *   <li>{@code RESOURCE_*} — Recursos (não encontrado, duplicado)</li>
 *   <li>{@code VALIDATION_*} — Validação de dados de entrada</li>
 *   <li>{@code BUSINESS_*} — Regras de negócio</li>
 *   <li>{@code RATE_LIMIT_*} — Limite de requisições</li>
 *   <li>{@code INTERNAL_*} — Erros internos do servidor</li>
 * </ul>
 */
public final class ApiErrorCode {
    private ApiErrorCode() {
    }

    /** Credenciais inválidas (email ou senha incorretos). */
    public static final String AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS";

    /** Token de acesso expirado ou inválido. */
    public static final String AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED";

    /** Refresh token expirado ou inválido. */
    public static final String AUTH_REFRESH_TOKEN_EXPIRED = "AUTH_REFRESH_TOKEN_EXPIRED";

    /** Token de redefinição de senha expirado ou inválido. */
    public static final String AUTH_RESET_TOKEN_INVALID = "AUTH_RESET_TOKEN_INVALID";

    /** Usuário não autenticado (token ausente). */
    public static final String AUTH_UNAUTHENTICATED = "AUTH_UNAUTHENTICATED";

    /** Usuário autenticado, mas sem permissão para o recurso. */
    public static final String AUTH_ACCESS_DENIED = "AUTH_ACCESS_DENIED";

    /** E-mail já cadastrado. */
    public static final String AUTH_EMAIL_ALREADY_EXISTS = "AUTH_EMAIL_ALREADY_EXISTS";

    /** Recurso não encontrado pelo identificador fornecido. */
    public static final String RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND";

    /** Tentativa de criar recurso que viola restrição de unicidade. */
    public static final String RESOURCE_DUPLICATE = "RESOURCE_DUPLICATE";

    /** Dados de entrada inválidos (erros de campo). */
    public static final String VALIDATION_FIELD_ERROR = "VALIDATION_FIELD_ERROR";

    /** JSON malformado ou corpo da requisição ilegível. */
    public static final String VALIDATION_BAD_REQUEST = "VALIDATION_BAD_REQUEST";

    /** Tipo de argumento inválido (ex.: UUID inválido na URL). */
    public static final String VALIDATION_TYPE_MISMATCH = "VALIDATION_TYPE_MISMATCH";

    /** Regra de negócio genérica violada. */
    public static final String BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION";

    /** Limite de requisições excedido. */
    public static final String RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";

    /** Erro interno não tratado. */
    public static final String INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";
}
