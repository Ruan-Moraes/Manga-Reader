# Register — Criar conta

## Rota

`/register`

## Layout em árvore

```
<AuthShell>
├── Side panel (desktop)
│   └── Mesma estrutura do Login (ilustração diferente: chibi `surpresa`)
│
└── Main panel
    ├── Eyebrow "Junte-se à comunidade"
    ├── <h1>Criar conta</h1>
    ├── Sub: "É grátis. Sem anúncios."
    │
    └── Form (max-w 380)
        ├── <Input label="Email" autoComplete="email" />
        ├── <Input label="Nome de exibição" />
        ├── <Input label="Senha" type="password" hint="Mín 8 chars, com número" />
        │   + password strength meter (ProgressBar tone dynamic)
        ├── <Input label="Confirmar senha" type="password" />
        ├── <Checkbox label={
        │     <>Li e aceito os <a>Termos</a> e a <a>Privacidade</a>.</>
        │   } required />
        ├── <Checkbox label="Quero receber novidades por email (opcional)" />
        ├── <Button primary block>Criar conta</Button>
        └── Footer: "Já tem conta? <a>Entrar</a>"
```

## Componentes

`AuthShell`, `Input`, `Checkbox`, `Button`, `ProgressBar` (strength), `Toast`.

## Estados

| Estado | UI |
|---|---|
| idle | form vazio |
| password_weak | strength bar danger; erro abaixo "Senha precisa ter ao menos número" |
| email_taken | Input email error "Esse email já está cadastrado" + link "Entrar" |
| terms_unchecked | Checkbox error "É preciso aceitar os termos pra continuar" |
| submitting | Button loading |
| sucesso | redirect pra onboarding (futuro) ou /profile com Toast "Bem-vindo!" |

## Comportamentos

- **Password strength**: weak/medium/strong baseado em entropy simples
- **Email check** debounced 800ms enquanto digita (se cadastrado, mostra inline)
- **Validação senha confirmada** ao perder foco do campo
- **Termos obrigatórios** — botão "Criar conta" disabled até check
- **Erros campo-a-campo** + Toast resumo em submit fail

## Responsividade

| Breakpoint | Layout |
|---|---|
| <lg | só main, centralizado |
| ≥lg | side panel + main |

## A11y

- Cada campo com `<Label htmlFor>` + `aria-describedby` para hint/error
- Password strength como `<output aria-live="polite">` ("Senha fraca/média/forte")
- Termos link abre em nova tab (`target="_blank" rel="noopener"`)
