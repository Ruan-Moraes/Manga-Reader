# Plano de Testes — Infrastructure / Security

> Camada de segurança: JWT (geração/validação/filtro), SecurityConfig, Rate Limiting. 5 classes.

---

## 1. JwtTokenProvider (implements TokenPort)

### Contexto
Implementação concreta do `TokenPort` usando a biblioteca jjwt. Gera e valida tokens JWT assinados com HMAC-SHA.

### Configurações Injetadas
| Propriedade | Tipo | Descrição |
|---|---|---|
| `app.jwt.secret` | `String` | Chave secreta BASE64 para assinatura HMAC |
| `app.jwt.access-token-expiration` | `long` | Duração do access token (ms) |
| `app.jwt.refresh-token-expiration` | `long` | Duração do refresh token (ms) |
| `app.jwt.password-reset-token-expiration` | `long` | Duração do token de reset (ms) |

### Métodos e Cenários

#### `generateAccessToken(UUID userId, String email, String role)`
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Geração com sucesso | Subject=userId, claims: email, role, type="access", exp=now+accessTtl |
| 2 | Token assinado | Assinatura HMAC-SHA com secretKey |

#### `generateRefreshToken(UUID userId)`
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Geração com sucesso | Subject=userId, type="refresh", sem email/role, exp=now+refreshTtl |

#### `generatePasswordResetToken(UUID userId, String email)`
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Geração com sucesso | Subject=userId, claims: email, type="password_reset", exp=now+resetTtl |

#### `isTokenValid(String token)`
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Token válido | Retorna `true` |
| 2 | Token expirado | Retorna `false` (catch `ExpiredJwtException`) |
| 3 | Assinatura inválida | Retorna `false` (catch `JwtException`) |
| 4 | Token malformado | Retorna `false` |
| 5 | Token null/empty | Retorna `false` |

#### `extractUserId(String token)` / `extractEmail()` / `extractRole()` / `extractType()`
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Claim existe | Retorna valor do claim |
| 2 | Token inválido | Lança exceção (JwtException) |

### Observações para Testes
- **Teste unitário**: gerar token → extrair claims → verificar valores
- **Teste de expiração**: gerar token com TTL=0 ou negativo → `isTokenValid()` deve retornar false
- Verificar que cada tipo de token tem o claim `type` correto: "access", "refresh", "password_reset"
- Verificar que refreshToken **não** contém email/role
- **Teste de integração**: verificar que `@Value` injeta corretamente do application.yml

---

## 2. JwtAuthenticationFilter (extends OncePerRequestFilter)

### Contexto
Filtro Spring Security que intercepta cada request, extrai o JWT do header `Authorization: Bearer`, valida e seta o `SecurityContext`.

### Fluxos
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Header ausente | Continua a cadeia sem autenticação (`filterChain.doFilter()`) |
| 2 | Header sem "Bearer " | Continua sem autenticação |
| 3 | Token válido (type=access) | Extrai userId/email/role, cria `UsernamePasswordAuthenticationToken`, seta `SecurityContextHolder` |
| 4 | Token válido mas type != access | **Não** autentica — filtra tokens refresh/password_reset |
| 5 | Token expirado/inválido | Continua sem autenticação (sem exceção) |

### Regras de Negócio
- Apenas tokens com `type="access"` são aceitos para autenticação HTTP
- `UsernamePasswordAuthenticationToken` com `authorities=[]` (sem roles como GrantedAuthority)
- O principal é setado como o userId (UUID como String)
- **Stateless**: não armazena sessão

### Observações para Testes
- **MockMvc integration**: testar com header `Authorization: Bearer <token>` válido/inválido
- Testar com refresh token no header → não deve autenticar
- Testar com password_reset token no header → não deve autenticar
- Verificar que `SecurityContextHolder` é populado após token válido
- **[HIPÓTESE]** Authorities vazio significa que não há controle por role via Spring Security — apenas por userId no use case

---

## 3. SecurityConfig

### Contexto
Configuração da cadeia de segurança do Spring Security.

### Endpoints Públicos (sem autenticação)
```
POST /auth/signup, /auth/signin, /auth/refresh, /auth/forgot-password, /auth/reset-password
GET  /titles/**, /comments/**, /ratings/**, /groups/**, /news/**, /events/**, /forum/**, /tags/**, /stores/**
GET  /swagger-ui/**, /api-docs/**, /v3/api-docs/**
GET  /actuator/health
```

### Endpoints Protegidos
```
Todos os outros → authenticated()
```

### Cadeia de Filtros
```
RateLimitFilter → JwtAuthenticationFilter → SecurityFilterChain
```

### Configurações
- CORS: delegado (`Customizer.withDefaults()`)
- CSRF: desabilitado (API stateless)
- Session: `STATELESS`
- Exception handling: `SecurityExceptionHandler` para 401/403

### Observações para Testes
- **Teste de integração @SpringBootTest + MockMvc**:
  - GET `/titles` sem token → 200 (público)
  - POST `/auth/signin` sem token → 200 (público)
  - GET `/auth/me` sem token → 401
  - DELETE `/ratings/{id}` sem token → 401
  - GET `/auth/me` com token válido → 200
- Testar que CSRF está desabilitado (POST sem CSRF token funciona)
- Verificar ordem dos filtros: RateLimit antes de JWT

---

## 4. SecurityExceptionHandler

### Contexto
Handler centralizado para exceções de autenticação e autorização. Retorna JSON em vez de HTML.

### Cenários
| # | Cenário | Response | Status |
|---|---------|----------|--------|
| 1 | Token ausente/inválido | `ApiErrorResponse("AUTH_UNAUTHENTICATED", "Token ausente ou inválido...", 401)` | 401 |
| 2 | Permissão insuficiente | `ApiErrorResponse("AUTH_ACCESS_DENIED", "Você não tem permissão...", 403)` | 403 |

### Observações para Testes
- Verificar que o response é JSON (`application/json`)
- Verificar estrutura do `ApiErrorResponse`
- Testar via MockMvc com endpoint protegido sem token → 401 com body JSON

---

## 5. RateLimitFilter (extends OncePerRequestFilter)

### Contexto
Rate limiting por IP usando Bucket4j. Intercepta todas as requests.

### Configuração
| Parâmetro | Valor |
|---|---|
| Capacidade | 120 tokens (burst) |
| Refill | 100 tokens/minuto (greedy) |
| Escopo | Por IP (ConcurrentHashMap) |

### Resolução de IP
```
1. Header X-Forwarded-For (primeiro IP) →
2. Header X-Real-IP →
3. request.getRemoteAddr()
```

### Endpoints Isentos
```
/actuator/health*
/swagger-ui*
/api-docs*
/v3/api-docs*
```

### Cenários
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Dentro do limite | Request passa normalmente |
| 2 | Excedeu limite | HTTP 429, header `Retry-After`, body JSON com mensagem |
| 3 | Endpoint isento | Bypass — nunca é limitado |

### Regras de Negócio
- `ConcurrentHashMap<String, Bucket>` — novo bucket por IP na primeira request
- `Bandwidth.classic(120, Refill.greedy(100, Duration.ofMinutes(1)))` — 120 burst, 100/min refill
- Response 429: `"Muitas requisições. Tente novamente em X segundos."`
- `Retry-After` header: segundos até próximo token disponível
- **Sem persistência**: reiniciar a aplicação reseta todos os buckets

### Observações para Testes
- **Teste unitário**: criar bucket, consumir 120 tokens → próximo consumo deve falhar
- **Teste de integração MockMvc**: enviar 121 requests → verificar que a última retorna 429
- Testar resolução de IP: X-Forwarded-For com múltiplos IPs → pega o primeiro
- Testar endpoints isentos: `/actuator/health` nunca retorna 429
- **[HIPÓTESE]** ConcurrentHashMap sem eviction → memory leak se muitos IPs distintos fazem requests

---

## Matriz de Cobertura

| Classe | Tipo de Teste | Cenários Felizes | Cenários Tristes | Prioridade |
|--------|--------------|------------------|------------------|------------|
| JwtTokenProvider | Unitário | 6 (geração + extração) | 4 (expirado, inválido, malformado, null) | **Alta** |
| JwtAuthenticationFilter | Integração (MockMvc) | 1 (token válido) | 4 (ausente, sem bearer, refresh, expirado) | **Alta** |
| SecurityConfig | Integração (MockMvc) | 5+ (endpoints públicos) | 3+ (endpoints protegidos sem token) | **Alta** |
| SecurityExceptionHandler | Integração | 2 (401, 403) | 0 | Média |
| RateLimitFilter | Unitário + Integração | 2 (dentro do limite, isento) | 1 (excedeu) | Média |

## Status: 🔲 Não Implementado
