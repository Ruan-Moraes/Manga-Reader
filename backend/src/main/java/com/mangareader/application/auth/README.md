# Plano de Testes — Application / Auth

> Módulo de autenticação e autorização. Contém 6 use cases + 1 port (TokenPort).

---

## 1. SignUpUseCase

### Contexto
Cadastra um novo usuário, cria a entidade `User` com `role=MEMBER` e retorna tokens JWT (access + refresh).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `UserRepositoryPort` | Port | `existsByEmail()`, `save()` |
| `PasswordEncoder` | Spring Security | `encode()` |
| `TokenPort` | Port | `generateAccessToken()`, `generateRefreshToken()` |

### Input
```java
record SignUpInput(String name, String email, String password)
```

### Output
```java
record SignUpOutput(String accessToken, String refreshToken, String userId, String name, String email, String role)
```

### Fluxos Felizes
| # | Cenário | Entrada | Comportamento Esperado |
|---|---------|---------|----------------------|
| 1 | Cadastro com sucesso | name, email único, password | Cria User (role=MEMBER), gera tokens, retorna SignUpOutput |
| 2 | Password é hashado | qualquer password | `passwordEncoder.encode(password)` é chamado; hash salvo em `user.passwordHash` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Email já existe | `DuplicateResourceException("User", "email", email)` | 409 |

### Regras de Negócio
- O role é **sempre** `MEMBER` — não vem do input
- O `userId` retornado é `user.getId().toString()` (UUID → String)
- Tokens são gerados após o `save()` — o user já tem ID

### Observações para Testes
- Mock de `UserRepositoryPort.existsByEmail()` → `true` para testar duplicata
- Mock de `UserRepositoryPort.save()` deve retornar o User com ID preenchido
- Verificar que `passwordEncoder.encode()` é chamado com a senha raw
- Verificar que `tokenPort.generateAccessToken()` recebe `(userId, email, "MEMBER")`
- **Não há validação de formato de email no use case** — depende de camada externa

---

## 2. SignInUseCase

### Contexto
Autentica um usuário por email/password e retorna tokens JWT.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `UserRepositoryPort` | Port | `findByEmail()` |
| `PasswordEncoder` | Spring Security | `matches()` |
| `TokenPort` | Port | `generateAccessToken()`, `generateRefreshToken()` |

### Input
```java
record SignInInput(String email, String password)
```

### Output
```java
record SignInOutput(String accessToken, String refreshToken, String userId, String name, String email, String role, String photoUrl)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Login com sucesso | Encontra user por email, valida password, retorna tokens + dados do user |
| 2 | Output inclui photoUrl | `user.getPhotoUrl()` é incluído no SignInOutput |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Email não encontrado | `BusinessRuleException("E-mail ou senha incorretos.", 401)` | 401 |
| 2 | Senha incorreta | `BusinessRuleException("E-mail ou senha incorretos.", 401)` | 401 |

### Regras de Negócio
- **Mensagem genérica** em ambos os cenários de falha — não revela se o email existe
- Utiliza `passwordEncoder.matches(rawPassword, hash)` — nunca compara strings diretamente
- O `role` retornado é `user.getRole().name()` (enum → String)

### Observações para Testes
- Mock `UserRepositoryPort.findByEmail()` → `Optional.empty()` para email inexistente
- Mock `passwordEncoder.matches()` → `false` para senha incorreta
- Verificar mensagem exatamente igual: `"E-mail ou senha incorretos."` em ambos os cenários
- Verificar que o status code é 401 em ambos os cenários

---

## 3. RefreshTokenUseCase

### Contexto
Renova um par de tokens (access + refresh) a partir de um refresh token válido.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TokenPort` | Port | `isTokenValid()`, `extractUserId()`, `generateAccessToken()`, `generateRefreshToken()` |
| `UserRepositoryPort` | Port | `findById()` |

### Input
```java
record RefreshInput(String refreshToken)
```

### Output
```java
record RefreshOutput(String accessToken, String refreshToken)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Refresh com sucesso | Valida token, extrai userId, busca user, gera novo par de tokens |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Token inválido/expirado | `BusinessRuleException("Refresh token inválido ou expirado.", 401)` | 401 |
| 2 | User não encontrado (token válido mas user deletado) | `ResourceNotFoundException("User", "id", userId)` | 404 |

### Regras de Negócio
- **Não** verifica o tipo do token (diferente do ResetPasswordUseCase)
- A validação ocorre via `tokenPort.isTokenValid()` — implementação pode verificar expiração e assinatura
- O refresh token antigo **não é invalidado** (sem blacklist)

### Observações para Testes
- **[HIPÓTESE]** Sem blacklist de tokens, um refresh token continua válido até expirar — possível vetor de replay
- Mock `tokenPort.isTokenValid()` → `false` para token expirado
- Mock `tokenPort.extractUserId()` deve retornar UUID válido
- Verificar cenário de user deletado após emissão do token

---

## 4. ForgotPasswordUseCase

### Contexto
Solicita recuperação de senha. Gera token JWT tipo `password_reset` e envia por email com link de redefinição.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `UserRepositoryPort` | Port | `findByEmail()` |
| `TokenPort` | Port | `generatePasswordResetToken()` |
| `EmailPort` | Port | `sendHtml()` |
| `@Value("${app.mail.base-url}")` | Config | Default: `http://localhost:5173` |

### Input
```java
String email
```

### Output
```java
void
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Email existe | Gera resetToken, monta URL `baseUrl + "/reset-password?token=" + token`, envia email HTML |
| 2 | Email HTML correto | Template contém nome do user, link com botão, mensagem de expiração de 15 min |

### Fluxos Tristes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Email **não** existe | **Nenhuma exceção** — método retorna silenciosamente |

### Regras de Negócio
- **Silencioso por design** — nunca revela se o email existe ou não (segurança contra enumeração)
- Usa `userRepository.findByEmail(email).ifPresent(...)` — o bloco só executa se encontrar
- O email HTML é construído com `String.formatted()` — template inline
- O link de reset aponta para o **frontend** (`/reset-password?token=`)
- Log em nível `DEBUG`: `"Password reset solicitado para: {email}"`

### Observações para Testes
- Verificar que `emailPort.sendHtml()` **não é chamado** quando email não existe
- Verificar que `tokenPort.generatePasswordResetToken()` recebe `(userId, email)`
- Verificar que a URL montada está correta: `baseUrl + "/reset-password?token=" + token`
- Testar injeção do `@Value` com valor customizado
- **[HIPÓTESE]** O texto diz "expira em 15 minutos" mas a duração real depende da implementação de `TokenPort` — validar consistência

---

## 5. ResetPasswordUseCase

### Contexto
Redefine a senha do usuário usando um token de reset previamente enviado por email.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TokenPort` | Port | `isTokenValid()`, `extractType()`, `extractUserId()` |
| `UserRepositoryPort` | Port | `findById()`, `save()` |
| `PasswordEncoder` | Spring Security | `encode()` |

### Input
```java
String token, String newPassword
```

### Output
```java
void
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Reset com sucesso | Valida token, verifica type="password_reset", busca user, faz encode da nova senha, salva |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Token inválido/expirado | `BusinessRuleException("Token de redefinição inválido ou expirado", 400)` | 400 |
| 2 | Token não é tipo password_reset | `BusinessRuleException("Token não é do tipo password_reset", 400)` | 400 |
| 3 | User não encontrado | `ResourceNotFoundException("User", "id", userId)` | 404 |

### Regras de Negócio
- Verifica **explicitamente** `type == "password_reset"` — rejeita access/refresh tokens
- Usa `passwordEncoder.encode(newPassword)` — nunca armazena senha raw
- Altera `user.passwordHash` via setter e faz `save()`
- **Não** invalida o token após uso — possível reutilização até expirar

### Observações para Testes
- Mock `tokenPort.extractType()` → `"access"` para testar rejeição de tipo errado
- Mock `tokenPort.extractType()` → `"password_reset"` para fluxo feliz
- Verificar que `passwordEncoder.encode()` é chamado com a nova senha
- **[HIPÓTESE]** Token reutilizável — testar execução duas vezes com mesmo token
- **Não há validação de força de senha** no use case — depende de camada externa

---

## 6. GetCurrentUserUseCase

### Contexto
Retorna os dados completos do usuário autenticado (endpoint `/auth/me`).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `UserRepositoryPort` | Port | `findById()` |

### Input
```java
UUID userId
```

### Output
```java
User (entidade completa)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | User encontrado | Retorna a entidade User completa |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | User não encontrado | `ResourceNotFoundException("User", "id", userId.toString())` | 404 |

### Regras de Negócio
- Retorna **toda** a entidade User — incluindo socialLinks e passwordHash
- **[HIPÓTESE]** O passwordHash pode ser exposto se o controller não filtrar — verificar a serialização no controller

### Observações para Testes
- Caso mais simples do módulo — 1 dependência, 1 chamada
- Verificar que lança exceção com `userId.toString()` (não UUID puro)

---

## 7. TokenPort (Interface)

### Contexto
Port de saída que define o contrato para geração e validação de tokens JWT. Implementada por `JwtTokenProvider` na camada de infraestrutura.

### Métodos
| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `generateAccessToken` | `UUID userId, String email, String role` | `String` | Token de acesso (curta duração) |
| `generateRefreshToken` | `UUID userId` | `String` | Token de renovação (longa duração) |
| `generatePasswordResetToken` | `UUID userId, String email` | `String` | Token de reset (curta duração, type=password_reset) |
| `extractUserId` | `String token` | `UUID` | Subject do token |
| `extractEmail` | `String token` | `String` | Claim customizado |
| `extractRole` | `String token` | `String` | Claim customizado |
| `extractType` | `String token` | `String` | Claim "type" (null para access/refresh, "password_reset" para reset) |
| `isTokenValid` | `String token` | `boolean` | Valida assinatura e expiração |

### Observações para Testes
- Use cases dependem de `TokenPort` — nos testes unitários, **sempre mockar**
- Para testes de integração, a implementação `JwtTokenProvider` deve ser testada separadamente
- Verificar que `extractType()` retorna `null` para tokens que não são password_reset (baseado no uso em ResetPasswordUseCase)

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Cache | Evento |
|----------|-------------------|----------------|----------------|-------|--------|
| SignUpUseCase | UserRepoPort, PasswordEncoder, TokenPort | 2 | 1 | ❌ | ❌ |
| SignInUseCase | UserRepoPort, PasswordEncoder, TokenPort | 2 | 2 | ❌ | ❌ |
| RefreshTokenUseCase | TokenPort, UserRepoPort | 1 | 2 | ❌ | ❌ |
| ForgotPasswordUseCase | UserRepoPort, TokenPort, EmailPort | 2 | 1* | ❌ | ❌ |
| ResetPasswordUseCase | TokenPort, UserRepoPort, PasswordEncoder | 1 | 3 | ❌ | ❌ |
| GetCurrentUserUseCase | UserRepoPort | 1 | 1 | ❌ | ❌ |

> *ForgotPassword: o "fluxo triste" é na verdade um retorno silencioso (sem exceção)

## Status: 🔲 Não Implementado
