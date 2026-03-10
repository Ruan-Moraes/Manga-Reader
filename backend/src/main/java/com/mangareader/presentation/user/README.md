# Plano de Testes — Presentation / User

> Controller de perfis de usuário (`UserController`). 3 endpoints em `/api/users/`. GET público + GET/PATCH autenticados. DTOs com Bean Validation. Mapper com role mapping e social links.

---

## 1. UserController

### Contexto
Controller REST de perfis. Combina endpoints públicos (perfil de qualquer user) e autenticados (meu perfil, atualizar).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetUserProfileUseCase` | Use Case | Busca perfil por UUID |
| `UpdateUserProfileUseCase` | Use Case | Atualiza perfil + social links (publica evento) |

### Base Path
```
/api/users
```

---

### 1.1 GET /api/users/me

#### Input
- `Authentication auth` (requerido)

#### Output
```java
// HTTP 200
ApiResponse<UserProfileResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Usuário logado | 200 + `UserProfileResponse` com `id, name, email, bio, photoUrl, role, socialLinks, createdAt` |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Sem autenticação | Spring Security | 401 |
| 2 | Usuário não encontrado | Use case → `ResourceNotFoundException` | 404 |

#### Observações para Testes
- `(UUID) auth.getPrincipal()` — mesmo padrão do AuthController
- Rota `/me` deve ser mapeada **antes** de `/{id}` no Spring (ordem de rota) — se não, `/me` pode ser interpretado como `{id}` [HIPÓTESE — Spring resolve corretamente por especificidade]

---

### 1.2 PATCH /api/users/me

#### Input
```java
record UpdateProfileRequest(
    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres") String name,
    @Size(max = 500, message = "Bio deve ter no máximo 500 caracteres") String bio,
    String photoUrl,
    List<SocialLinkInput> socialLinks
) {
    record SocialLinkInput(String platform, String url) {}
}
```

#### Output
```java
// HTTP 200
ApiResponse<UserProfileResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Atualizar nome | 200 + perfil atualizado |
| 2 | Atualizar bio | 200 + bio atualizada |
| 3 | Atualizar social links | `socialLinks` → convertidos para `SocialLinkInput` do use case |
| 4 | Atualizar parcial | Apenas `name` — outros null ignorados |
| 5 | Limpar social links | `socialLinks = []` → remove todas |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Nome < 2 chars | `@Size(min=2)` | 400 + `fieldErrors.name` |
| 2 | Nome > 100 chars | `@Size(max=100)` | 400 |
| 3 | Bio > 500 chars | `@Size(max=500)` | 400 |
| 4 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- **PATCH** (não PUT) — `@PatchMapping("/me")`
- PATCH semântico — campos nulos ignorados
- `@Size` valida **se presente** — `null` passa (sem `@NotBlank`)
- `socialLinks` tem conversão no controller:
  ```java
  request.socialLinks().stream()
      .map(sl -> new SocialLinkInput(sl.platform(), sl.url()))
      .toList()
  ```
- Se `socialLinks` é `null` → `null` passado ao use case (sem conversão)
- `SocialLinkInput` do DTO é **diferente** do `SocialLinkInput` do use case — mesmos campos, packages diferentes
- `photoUrl` sem validação — aceita qualquer String

---

### 1.3 GET /api/users/{id}

#### Input
- `@PathVariable UUID id`

#### Output
```java
// HTTP 200
ApiResponse<UserProfileResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Perfil encontrado | 200 + `UserProfileResponse` completo |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Usuário não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 2 | ID inválido (não UUID) | `MethodArgumentTypeMismatchException` | 400 + `VALIDATION_TYPE_MISMATCH` |

#### Observações para Testes
- Endpoint **público** — sem `Authentication`
- Retorna mesmo `UserProfileResponse` que `/me` — inclui email [HIPÓTESE — pode ser problema de privacidade]
- Usa mesmo `GetUserProfileUseCase` que `/me`

---

## 2. UserProfileResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record UserProfileResponse(
    String id, String name, String email, String bio, String photoUrl,
    String role, List<SocialLinkResponse> socialLinks, LocalDateTime createdAt
) {
    record SocialLinkResponse(String id, String platform, String url) {}
}
```

### Observações para Testes
- `createdAt` é `LocalDateTime` (não String) — Jackson serializa com formato default ISO
- `role` é string mapeada: `ADMIN → "admin"`, `MODERATOR → "poster"`, `MEMBER → "user"`
- **Nota**: `MODERATOR → "poster"` (não "moderator") — mapeamento não-trivial
- `socialLinks` null → omitido pelo `@JsonInclude(NON_NULL)`
- `SocialLinkResponse` é inner record com `id` (UUID→String), `platform`, `url`

---

## 3. UserMapper

### Métodos
| Método | Entrada | Saída |
|--------|---------|-------|
| `toProfileResponse(User)` | Entidade | `UserProfileResponse` |

### Observações para Testes
- **Sem null-check** em `toProfileResponse()` — user null → NPE
- `socialLinks` null → `List.of()` (lista imóvel vazia)
- `socialLinks` não null → stream + `toSocialLinkResponse()`
- `link.getId().toString()` — se link ID null → NPE [HIPÓTESE]
- Role mapping:
  - `ADMIN` → `"admin"`
  - `MODERATOR` → `"poster"` — **atenção: "poster", não "moderator"**
  - `MEMBER` → `"user"` — **atenção: "user", não "member"**
- `user.getCreatedAt()` passado diretamente como `LocalDateTime` — sem formatação String

---

## Status: PENDENTE
