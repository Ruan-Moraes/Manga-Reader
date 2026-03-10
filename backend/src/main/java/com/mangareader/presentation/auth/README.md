# Plano de Testes — Presentation / Auth

> Controller de autenticação (`AuthController`). 6 endpoints em `/api/auth/`. DTOs com Bean Validation. Respostas via `ApiResponse<>`.

---

## 1. AuthController

### Contexto
Controller REST para autenticação e autorização. Endpoints de sign-in/sign-up são públicos; `/me` requer autenticação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `SignInUseCase` | Use Case | Login por email/password |
| `SignUpUseCase` | Use Case | Cadastro de novo usuário |
| `RefreshTokenUseCase` | Use Case | Renovação de tokens |
| `GetCurrentUserUseCase` | Use Case | Busca usuário logado por ID |
| `ForgotPasswordUseCase` | Use Case | Envia email de recuperação |
| `ResetPasswordUseCase` | Use Case | Redefine senha via token |

### Base Path
```
/api/auth
```

---

### 1.1 POST /api/auth/sign-in

#### Input
```java
record SignInRequest(
    @NotBlank(message = "O e-mail é obrigatório.") @Email(message = "E-mail inválido.") String email,
    @NotBlank(message = "A senha é obrigatória.") String password
)
```

#### Output
```java
// HTTP 200
ApiResponse<AuthResponse>
// AuthResponse: record(String accessToken, String refreshToken, String userId, String name, String email, String role, String photoUrl)
// @JsonInclude(NON_NULL) — campos nulos omitidos
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Login com sucesso | 200 + `ApiResponse.success(AuthResponse)` com todos os campos preenchidos |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Email em branco | `@NotBlank` | 400 + `ValidationErrorResponse` |
| 2 | Email formato inválido | `@Email` | 400 + `ValidationErrorResponse` com campo `email` |
| 3 | Senha em branco | `@NotBlank` | 400 + `ValidationErrorResponse` |
| 4 | Credenciais incorretas | Use case lança `BusinessRuleException` | Via `GlobalExceptionHandler` |
| 5 | JSON malformado | `HttpMessageNotReadableException` | 400 + `VALIDATION_BAD_REQUEST` |

#### Observações para Testes
- `@Valid @RequestBody` — testar validação de todos os campos
- Não há `Authentication` — endpoint público
- O controller delega diretamente ao use case, sem transformação adicional

---

### 1.2 POST /api/auth/sign-up

#### Input
```java
record SignUpRequest(
    @NotBlank(message = "O nome é obrigatório.") @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.") String name,
    @NotBlank(message = "O e-mail é obrigatório.") @Email(message = "E-mail inválido.") String email,
    @NotBlank(message = "A senha é obrigatória.") @Size(min = 6, max = 128, message = "A senha deve ter entre 6 e 128 caracteres.") String password
)
```

#### Output
```java
// HTTP 201 Created
ApiResponse<AuthResponse>  // ApiResponse.created(...)
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Cadastro com sucesso | 201 + `ApiResponse.created(AuthResponse)` — inclui `message: "Recurso criado com sucesso."` |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Nome < 2 chars | `@Size(min=2)` | 400 + `fieldErrors.name` |
| 2 | Nome > 100 chars | `@Size(max=100)` | 400 + `fieldErrors.name` |
| 3 | Email inválido | `@Email` | 400 + `fieldErrors.email` |
| 4 | Senha < 6 chars | `@Size(min=6)` | 400 + `fieldErrors.password` |
| 5 | Senha > 128 chars | `@Size(max=128)` | 400 + `fieldErrors.password` |
| 6 | Email duplicado | Use case → `DuplicateResourceException` | 409 + `RESOURCE_DUPLICATE` |
| 7 | Múltiplos campos inválidos | Todas as annotations falham | 400 + `fieldErrors` com múltiplas chaves |

#### Observações para Testes
- Retorna **201 CREATED** (não 200) — `ResponseEntity.status(HttpStatus.CREATED)`
- O input do use case é montado inline: `new SignUpInput(request.name(), request.email(), request.password())`
- Verificar que mensagens de validação são em **pt-BR**

---

### 1.3 POST /api/auth/refresh

#### Input
```java
record RefreshTokenRequest(
    @NotBlank(message = "O refresh token é obrigatório.") String refreshToken
)
```

#### Output
```java
// HTTP 200
ApiResponse<AuthResponse>
// Nota: no refresh, campos de user (name, email, etc.) são NULL — NON_NULL os omite
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Refresh com sucesso | 200 + `AuthResponse` com `accessToken` e `refreshToken` preenchidos |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Token em branco | `@NotBlank` | 400 + `ValidationErrorResponse` |
| 2 | Token expirado/inválido | Use case → exception | Via `GlobalExceptionHandler` |

#### Observações para Testes
- `AuthResponse` com campos de user null → serializa como `{ accessToken, refreshToken, success: true }` (NON_NULL)
- Endpoint público — sem `Authentication`

---

### 1.4 GET /api/auth/me

#### Input
- `Authentication auth` (injetado pelo Spring Security)
- Nenhum request body

#### Output
```java
// HTTP 200
ApiResponse<AuthResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Usuário autenticado | 200 + `AuthResponse` com dados do user — **sem tokens** (null → omitidos) |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Sem token de autenticação | Spring Security intercepta | 401 + `AUTH_UNAUTHENTICATED` |
| 2 | Token expirado | Spring Security intercepta | 401 + `AUTH_TOKEN_EXPIRED` |
| 3 | Usuário não encontrado | Use case → `ResourceNotFoundException` | 404 |

#### Observações para Testes
- `(UUID) auth.getPrincipal()` — o principal é um UUID, não um UserDetails
- O output do use case inclui `userId, name, email, role, photoUrl` mas **não tokens**
- Requer mock de `Authentication` com `getPrincipal()` retornando UUID

---

### 1.5 POST /api/auth/forgot-password

#### Input
```java
record ForgotPasswordRequest(
    @NotBlank(message = "O e-mail é obrigatório.") @Email(message = "E-mail inválido.") String email
)
```

#### Output
```java
// HTTP 200
ApiResponse<Void>  // ApiResponse.success(null, "Se o e-mail estiver cadastrado, você receberá um link de recuperação.")
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Email cadastrado | 200 + mensagem genérica (email enviado internamente) |
| 2 | Email não cadastrado | 200 + **mesma mensagem genérica** (silenciado por segurança) |

#### Observações para Testes
- **Resposta sempre igual** — não revela se email existe no sistema (anti-enumeração)
- Mensagem fixa: `"Se o e-mail estiver cadastrado, você receberá um link de recuperação."`
- O `data` é `null` → omitido no JSON por `@JsonInclude(NON_NULL)`
- Testar que não lança exceção mesmo para email inexistente

---

### 1.6 POST /api/auth/reset-password

#### Input
```java
record ResetPasswordRequest(
    @NotBlank(message = "O token é obrigatório.") @Size(max = 2048, message = "Token inválido.") String token,
    @NotBlank(message = "A nova senha é obrigatória.") @Size(min = 6, max = 128, message = "A senha deve ter entre 6 e 128 caracteres.") String newPassword
)
```

#### Output
```java
// HTTP 200
ApiResponse<Void>  // ApiResponse.success(null, "Senha redefinida com sucesso.")
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Reset com sucesso | 200 + mensagem de sucesso |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Token em branco | `@NotBlank` | 400 + `fieldErrors.token` |
| 2 | Token > 2048 chars | `@Size(max=2048)` | 400 + `fieldErrors.token` |
| 3 | Senha < 6 chars | `@Size(min=6)` | 400 + `fieldErrors.newPassword` |
| 4 | Token inválido/expirado | Use case → exception | Via handler |

#### Observações para Testes
- Mensagem fixa: `"Senha redefinida com sucesso."`
- `token` aceita até 2048 chars — suficiente para JWT longo
- `@Size(max=2048)` com mensagem genérica `"Token inválido."` — não revela limite real

---

## 2. AuthResponse (DTO de Resposta)

### Contexto
DTO compartilhado por sign-in, sign-up, refresh e /me. `@JsonInclude(NON_NULL)` permite reutilização com campos parciais.

### Estrutura
```java
@JsonInclude(JsonInclude.Include.NON_NULL)
record AuthResponse(String accessToken, String refreshToken, String userId, String name, String email, String role, String photoUrl)
```

### Cenários de Serialização
| Operação | Campos Presentes | Campos Omitidos (null) |
|----------|-----------------|----------------------|
| Sign-in | todos | nenhum |
| Sign-up | todos | photoUrl (se null) |
| Refresh | accessToken, refreshToken | userId, name, email, role, photoUrl |
| /me | userId, name, email, role, photoUrl | accessToken, refreshToken |

### Observações para Testes
- Testar serialização JSON para cada cenário acima
- Garantir que campos `null` **não aparecem** no JSON output

---

## Status: PENDENTE
