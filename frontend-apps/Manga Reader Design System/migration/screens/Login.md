# Login

> Tela de entrada do usuário. Layout com side panel ilustrativo no desktop.

## Rota

`/login`
Query opcional: `?next=/library` (redireciona após sucesso)

## Layout em árvore

```
<AuthShell> (layout custom — não usa PageContainer normal)
├── Side panel (desktop ≥lg, 360px à esquerda)
│   ├── Wordmark grande
│   ├── Tagline: "Leia, catalogue e participe..."
│   ├── Ilustração chibi `feliz` ou `pensando` (320×320)
│   └── Footer: links de termos/privacidade
│
└── Main panel (1fr)
    ├── Eyebrow "Bem-vindo de volta"
    ├── <h1>Entrar</h1>
    ├── Sub: "Continue de onde parou"
    │
    ├── Form (max-w 380, centralizado em mobile)
    │   ├── <Input type=email leadingIcon={Mail} label="Email" />
    │   ├── <Input type=password leadingIcon={Lock} label="Senha"
    │   │       trailingIcon={Eye} /> ← toggle de visibilidade
    │   ├── Row: <Checkbox label="Lembrar de mim" /> + <a>Esqueci a senha</a>
    │   ├── <Button variant="primary" block loading={submitting}>Entrar</Button>
    │   │
    │   ├── Divider "ou"
    │   │
    │   ├── Botões de SSO (futuro): Google, Apple, Discord
    │   │
    │   └── Footer: "Não tem conta? <a>Criar conta</a>"
```

## Componentes

`AuthShell` (layout local), `Input`, `Checkbox`, `Button`, `Badge`, `Toast`.

## Estados

| Estado | UI |
|---|---|
| idle | form vazio |
| validating | botão loading |
| credentials_error | Input password com error "Email ou senha incorretos" |
| account_locked | Toast danger "Conta bloqueada. Confira seu email" |
| email_not_verified | banner topo + link reenviar |
| sucesso | redirect pra `next` ou `/profile` |

## Comportamentos

- **Validação client-side** mínima (email format + senha não vazia)
- **Persistir email** em localStorage se "Lembrar de mim" marcado
- **Auto-focus** no campo de email
- **Enter submete** o form
- **Toggle visibilidade da senha** com ícone Eye/EyeOff
- **Erros** mostrados inline + Toast em casos não-óbvios (bloqueio, throttle)

## Responsividade

| Breakpoint | Layout |
|---|---|
| <lg | só main panel, centralizado, max-w 380 |
| ≥lg | grid 360px + 1fr; side panel visível |

## A11y

- Form com `<form>` + `aria-labelledby` no h1
- Input email tem `autoComplete="email"` + `inputMode="email"`
- Input password tem `autoComplete="current-password"`
- Botão toggle visibility tem `aria-label="Mostrar senha"` / "Esconder senha"
- Erros associados via `aria-describedby`
