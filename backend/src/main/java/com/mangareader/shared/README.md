# Plano de Testes — Shared / Response Wrappers & Exception Handling

> Componentes transversais utilizados por toda a camada de apresentação: wrappers de resposta (`ApiResponse`, `PageResponse`, `ApiErrorResponse`, `ValidationErrorResponse`), códigos de erro (`ApiErrorCode`) e o `GlobalExceptionHandler`.

---

## 1. ApiResponse\<T\>

### Contexto
Record genérico que encapsula todas as respostas de sucesso da API. Usa `@JsonInclude(NON_NULL)` — campos nulos não são serializados.

### Estrutura
```java
record ApiResponse<T>(T data, boolean success, String message, Integer statusCode)
```

### Métodos Factory
| Método | `data` | `success` | `message` | `statusCode` |
|--------|--------|-----------|-----------|---------------|
| `success(T data)` | payload | `true` | `null` | `null` |
| `success(T data, String message)` | payload | `true` | mensagem | `null` |
| `created(T data)` | payload | `true` | `"Recurso criado com sucesso."` | `201` |
| `error(String message, int statusCode)` | `null` | `false` | mensagem | código HTTP |

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | `success(data)` | `{ data: ..., success: true }` — sem `message` e `statusCode` no JSON |
| 2 | `created(data)` | `{ data: ..., success: true, message: "Recurso criado com sucesso.", statusCode: 201 }` |
| 3 | `success(data, "ok")` | `{ data: ..., success: true, message: "ok" }` |
| 4 | `error("msg", 400)` | `{ success: false, message: "msg", statusCode: 400 }` — sem `data` |

### Observações para Testes
- Testar serialização JSON com `ObjectMapper` para garantir que `@JsonInclude(NON_NULL)` remove campos nulos
- Usado por **todos** os controllers — verificar que nenhum endpoint retorna resposta fora desse wrapper
- `created()` fixa a mensagem — não é parametrizável

---

## 2. PageResponse\<T\>

### Contexto
Converte `Page<T>` do Spring Data em um DTO flat/desacoplado do framework.

### Estrutura
```java
record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean last)
```

### Factory
```java
static <T> PageResponse<T> from(Page<T> page)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Page com conteúdo | `content` = lista de itens, `page/size/totalElements/totalPages/last` mapeados corretamente |
| 2 | Page vazia | `content` = `[]`, `totalElements` = 0, `last` = true |
| 3 | Última página | `last` = `true` |
| 4 | Página intermediária | `last` = `false` |

### Observações para Testes
- `page.getNumber()` → `page` (0-indexed)
- `page.getSize()` → `size` (tamanho requisitado, não o efetivo)
- Ideal testar com `PageImpl` para simular diferentes cenários de paginação

---

## 3. ApiErrorResponse

### Contexto
Shape padronizada para respostas de erro. Contém `code` (técnico, da `ApiErrorCode`) para o frontend mapear mensagens amigáveis.

### Estrutura
```java
record ApiErrorResponse(boolean success, String code, String message, int statusCode, Object rawData)
```

### Construtores
| Construtor | `success` | `rawData` |
|------------|-----------|-----------|
| `(String code, String message, int statusCode)` | `false` | `null` |
| `(String code, String message, int statusCode, Object rawData)` | `false` | dados extras |

### Observações para Testes
- `success` é **sempre** `false` — valor fixo nos construtores
- `rawData` é `Object` — pode conter qualquer coisa (Map, String, etc.) — o `@JsonInclude(NON_NULL)` omite se nulo
- Verificar serialização JSON para garantir shape esperada pelo frontend

---

## 4. ValidationErrorResponse

### Contexto
Resposta especializada para erros de validação com detalhes por campo.

### Estrutura
```java
record ValidationErrorResponse(boolean success, String code, String message, int statusCode, Map<String, String> fieldErrors)
```

### Construtor
```java
ValidationErrorResponse(String message, Map<String, String> fieldErrors)
// → success=false, code="VALIDATION_FIELD_ERROR", statusCode=400
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Múltiplos campos inválidos | `fieldErrors` = `{ "email": "...", "password": "..." }` |
| 2 | Um campo inválido | `fieldErrors` = `{ "name": "..." }` |

### Observações para Testes
- `code` é **sempre** `VALIDATION_FIELD_ERROR`
- `statusCode` é **sempre** `400`
- Chave do `fieldErrors` = nome do campo, valor = mensagem da annotation

---

## 5. ApiErrorCode

### Contexto
Classe com constantes `String` organizadas por categoria. O backend retorna o código técnico; o frontend mapeia para mensagens amigáveis.

### Códigos Conhecidos
| Categoria | Código | Uso Típico |
|-----------|--------|------------|
| AUTH | `AUTH_INVALID_CREDENTIALS` | Credenciais inválidas |
| AUTH | `AUTH_TOKEN_EXPIRED` | Token de acesso expirado |
| AUTH | `AUTH_REFRESH_TOKEN_EXPIRED` | Refresh token expirado |
| AUTH | `AUTH_RESET_TOKEN_INVALID` | Token de reset inválido |
| AUTH | `AUTH_UNAUTHENTICATED` | Token ausente |
| AUTH | `AUTH_ACCESS_DENIED` | Sem permissão |
| AUTH | `AUTH_EMAIL_ALREADY_EXISTS` | Email duplicado |
| RESOURCE | `RESOURCE_NOT_FOUND` | Recurso não encontrado (404) |
| RESOURCE | `RESOURCE_DUPLICATE` | Recurso duplicado (409) |
| VALIDATION | `VALIDATION_FIELD_ERROR` | Erro de campo (400) |
| VALIDATION | `VALIDATION_BAD_REQUEST` | JSON malformado (400) |
| VALIDATION | `VALIDATION_TYPE_MISMATCH` | Tipo de argumento inválido |
| BUSINESS | `BUSINESS_RULE_VIOLATION` | Regra de negócio violada |
| RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | Limite de requisições |
| INTERNAL | `INTERNAL_SERVER_ERROR` | Erro genérico 500 |

### Observações para Testes
- Classe utilitária — construtor privado — não instanciável
- Testar via reflexão que construtor privado existe (cobertura) ou ignorar
- Os códigos são `public static final String` — podem ser usados diretamente em assertions

---

## 6. GlobalExceptionHandler

### Contexto
`@RestControllerAdvice` que captura exceções e retorna respostas padronizadas. **Ponto central de tratamento de erros** da API.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `ResourceNotFoundException` | Custom Exception | → 404 |
| `NoResourceFoundException` | Spring MVC | → 404 |
| `DuplicateResourceException` | Custom Exception | → 409 |
| `BusinessRuleException` | Custom Exception | → status dinâmico |
| `MethodArgumentNotValidException` | Spring (@Valid) | → 400 |
| `ConstraintViolationException` | Jakarta Validation | → 400 |
| `HttpMessageNotReadableException` | Spring (JSON) | → 400 |
| `MethodArgumentTypeMismatchException` | Spring (URL params) | → 400 |
| `Exception` | Catch-all | → 500 |

### Mapeamento Exceção → Resposta
| # | Exceção | HTTP Status | Código (`ApiErrorCode`) | Tipo Resposta |
|---|---------|-------------|------------------------|---------------|
| 1 | `ResourceNotFoundException` | 404 | `RESOURCE_NOT_FOUND` | `ApiErrorResponse` |
| 2 | `NoResourceFoundException` | 404 | `RESOURCE_NOT_FOUND` | `ApiErrorResponse` |
| 3 | `DuplicateResourceException` | 409 | `RESOURCE_DUPLICATE` | `ApiErrorResponse` |
| 4 | `BusinessRuleException` | dinâmico (`ex.getStatusCode()`) | `ex.getErrorCode()` | `ApiErrorResponse` |
| 5 | `MethodArgumentNotValidException` | 400 | `VALIDATION_FIELD_ERROR` | `ValidationErrorResponse` |
| 6 | `ConstraintViolationException` | 400 | `VALIDATION_FIELD_ERROR` | `ValidationErrorResponse` |
| 7 | `HttpMessageNotReadableException` | 400 | `VALIDATION_BAD_REQUEST` | `ApiErrorResponse` |
| 8 | `MethodArgumentTypeMismatchException` | 400 | `VALIDATION_TYPE_MISMATCH` | `ApiErrorResponse` |
| 9 | `Exception` (genérica) | 500 | `INTERNAL_SERVER_ERROR` | `ApiErrorResponse` |

### Fluxos Felizes (por handler)
| # | Cenário | Entrada | Resposta |
|---|---------|---------|----------|
| 1 | `ResourceNotFoundException("Title", "id", "abc")` | GET /api/titles/abc | `{ success: false, code: "RESOURCE_NOT_FOUND", message: "Title não encontrado com id: 'abc'", statusCode: 404 }` |
| 2 | `DuplicateResourceException("User", "email", "x@y.com")` | POST /api/auth/sign-up | `{ success: false, code: "RESOURCE_DUPLICATE", message: "User já existe com email: 'x@y.com'", statusCode: 409 }` |
| 3 | `BusinessRuleException("msg", 403, "AUTH_ACCESS_DENIED")` | PUT /api/groups/{id} | `{ success: false, code: "AUTH_ACCESS_DENIED", message: "msg", statusCode: 403 }` |
| 4 | `@Valid` falha em 2 campos | POST com body inválido | `{ success: false, code: "VALIDATION_FIELD_ERROR", message: "Os dados enviados são inválidos.", statusCode: 400, fieldErrors: {...} }` |
| 5 | JSON malformado | POST com body não-JSON | `{ ..., code: "VALIDATION_BAD_REQUEST", message: "Requisição inválida. Verifique os dados enviados." }` |
| 6 | UUID inválido na URL | GET /api/groups/not-a-uuid | `{ ..., code: "VALIDATION_TYPE_MISMATCH", message: "Requisição inválida. Verifique os dados enviados." }` |
| 7 | NullPointerException inesperado | qualquer | `{ ..., code: "INTERNAL_SERVER_ERROR", message: "Erro interno do servidor. Tente novamente mais tarde.", statusCode: 500 }` |

### Observações para Testes
- **Testar via `@WebMvcTest` ou `MockMvc`** — injetar controller que lança cada tipo de exceção
- `MethodArgumentNotValidException`: o handler itera `getBindingResult().getFieldErrors()` — testar com múltiplos campos inválidos
- `ConstraintViolationException`: o handler usa `violation.getPropertyPath()` como chave — pode conter prefixo do método (ex: `create.arg0.email`)
- `BusinessRuleException(message)` default → statusCode=422, errorCode=`BUSINESS_RULE_VIOLATION`
- `BusinessRuleException(message, statusCode)` → statusCode customizado, errorCode=`BUSINESS_RULE_VIOLATION`
- `BusinessRuleException(message, statusCode, errorCode)` → totalmente customizado
- Mensagem fixa `"Recurso não encontrado."` para `NoResourceFoundException` (sem detalhes do recurso)
- **Logging**: `log.warn` para 4xx, `log.error` para 500 — verificar via spy/mock de logger se necessário

---

## 7. ResourceNotFoundException

### Contexto
Exceção para recurso não encontrado. Carrega `resourceName`, `fieldName` e `fieldValue`.

### Construtor
```java
ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue)
// message = "%s não encontrado com %s: '%s'"
```

### Observações para Testes
- `@ResponseStatus(NOT_FOUND)` presente mas **ignorada** — o `GlobalExceptionHandler` trata antes
- Verificar `getResourceName()`, `getFieldName()`, `getFieldValue()` retornam valores corretos
- Mensagem formatada: `"Title não encontrado com id: 'abc123'"`

---

## 8. DuplicateResourceException

### Contexto
Exceção para violação de unicidade. Carrega `resourceName`, `fieldName` e `fieldValue`.

### Construtor
```java
DuplicateResourceException(String resourceName, String fieldName, Object fieldValue)
// message = "%s já existe com %s: '%s'"
```

### Observações para Testes
- `@ResponseStatus(CONFLICT)` presente mas **ignorada** — o handler trata antes
- Mensagem formatada: `"User já existe com email: 'x@y.com'"`

---

## 9. BusinessRuleException

### Contexto
Exceção genérica para violações de regra de negócio. Suporta status HTTP e código de erro customizáveis.

### Construtores
| Construtor | `statusCode` | `errorCode` |
|------------|-------------|-------------|
| `(String message)` | `422` | `BUSINESS_RULE_VIOLATION` |
| `(String message, int statusCode)` | custom | `BUSINESS_RULE_VIOLATION` |
| `(String message, int statusCode, String errorCode)` | custom | custom |

### Observações para Testes
- Default é 422 (Unprocessable Entity) — nem 400 nem 403
- O handler usa `HttpStatus.valueOf(ex.getStatusCode())` — statusCode inválido (ex: 999) lança `IllegalArgumentException` → cai no catch-all 500 [HIPÓTESE]
- Testar os 3 construtores separadamente

---

## Status: PENDENTE
