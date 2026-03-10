# Plano de Testes — Infrastructure / Email

> Adaptadores de envio de email com 3 implementações por profile. Implementam `EmailPort`.

---

## Interface: EmailPort

```java
void send(String to, String subject, String body);      // texto plano
void sendHtml(String to, String subject, String htmlBody); // HTML
```

---

## 1. SmtpEmailAdapter (Profile: `prod`)

### Contexto
Implementação real de envio de email usando `JavaMailSender`.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `JavaMailSender` | Spring Mail | Envio SMTP |
| `app.mail.from` | `@Value` | Remetente (default: `noreply@mangareader.com`) |

### Cenários de `send()`
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Envio com sucesso | `SimpleMailMessage` com from, to, subject, body → `mailSender.send()` |

### Cenários de `sendHtml()`
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Envio com sucesso | `MimeMessage` com encoding UTF-8, `setText(htmlBody, true)` |
| 2 | Erro de messaging | `MessagingException` → wrapped em `RuntimeException` |

### Regras de Negócio
- `sendHtml` usa `MimeMessageHelper(message, true, "UTF-8")` — multipart=true
- `setText(htmlBody, true)` — o segundo parâmetro indica HTML
- Erros de `MessagingException` são convertidos em `RuntimeException("Falha ao enviar email")`

### Observações para Testes
- **Teste unitário**: mock `JavaMailSender`, verificar que `send` / `createMimeMessage` são chamados
- **Teste de integração**: requer SMTP server (GreenMail para embedded) ou mock
- Verificar que `from` é setado corretamente via `@Value`
- Testar cenário de `MessagingException` → RuntimeException

---

## 2. ConsoleEmailAdapter (Profile: `dev | default`)

### Contexto
Loga emails no console para desenvolvimento local.

### Cenários
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | `send()` | Log formatado com bordas: to, subject, body |
| 2 | `sendHtml()` | Log formatado com bordas: to, subject, htmlBody |

### Observações para Testes
- Pode ser testado verificando output do logger (ou `System.out` se usado)
- **Baixa prioridade** — adapter de dev

---

## 3. NoopEmailAdapter (Profile: `test`)

### Contexto
No-op para testes. Métodos com body vazio.

### Cenários
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | `send()` | Nada acontece |
| 2 | `sendHtml()` | Nada acontece |

### Observações para Testes
- Não precisa ser testado diretamente
- Usado automaticamente em `@SpringBootTest` com profile `test`
- Garante que testes de integração não enviam emails reais

---

## Uso no Sistema
- `ForgotPasswordUseCase` → `emailPort.sendHtml(email, subject, htmlBody)`
- Apenas um use case usa email — a interface `EmailPort` é subutilizada

---

## Matriz de Cobertura

| Adapter | Profile | Tipo de Teste | Prioridade |
|---------|---------|--------------|------------|
| SmtpEmailAdapter | prod | Unitário (mock JavaMailSender) | Média |
| ConsoleEmailAdapter | dev | Baixo valor | Baixa |
| NoopEmailAdapter | test | Não precisa | — |

## Status: 🔲 Não Implementado
