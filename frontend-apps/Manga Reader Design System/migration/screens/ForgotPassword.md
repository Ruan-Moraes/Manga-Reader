# ForgotPassword — Recuperar senha

## Rota

`/forgot` e `/reset?token=...`

## Layout em árvore (passo 1: pedir email)

```
<AuthShell>
└── Main panel
    ├── Eyebrow "Recuperar acesso"
    ├── <h1>Esqueci a senha</h1>
    ├── Sub: "Vamos enviar um link pro seu email"
    │
    └── Form
        ├── <Input label="Email cadastrado" autoComplete="email" />
        ├── <Button primary block>Enviar link</Button>
        └── Footer: "Lembrou? <a>Voltar pro login</a>"
```

## Layout em árvore (passo 2: email enviado)

```
<AuthShell>
└── Main panel
    ├── Ilustração chibi `pensando` (140)
    ├── <h1>Olha sua caixa de entrada</h1>
    ├── Sub: "Mandamos um link pra <strong>{email}</strong>. Vale por 30 minutos."
    │
    ├── <Button raised>Não chegou? Reenviar</Button> (disabled 30s, countdown)
    └── Footer: "Errou o email? <a>Tentar de novo</a>"
```

## Layout em árvore (passo 3: nova senha — rota /reset)

```
<AuthShell>
└── Main panel
    ├── <h1>Defina uma nova senha</h1>
    ├── Sub: "Token válido. Crie uma senha forte."
    │
    └── Form
        ├── <Input label="Nova senha" type="password" hint="Mín 8 chars com número" />
        ├── + password strength meter
        ├── <Input label="Confirmar nova senha" type="password" />
        ├── <Button primary block>Atualizar senha</Button>
        └── Token inválido/expirado: EmptyState `triste` + "Token expirou" + Button "Pedir novo"
```

## Componentes

`AuthShell`, `Input`, `Button`, `ProgressBar` (strength), `EmptyState`, `Toast`.

## Estados

| Estado | UI |
|---|---|
| step1 idle | form |
| step1 submitting | button loading |
| step1 throttled | Toast "Aguarde X minutos pra pedir de novo" |
| step1 unknown_email | mostra confirmação mesmo se não cadastrado (evita enumeração) |
| step2 | confirmação |
| step2 resend | countdown 30s no botão |
| step3 token_invalid | EmptyState + Button "Pedir novo link" |
| step3 success | Toast "Senha atualizada" + redirect pra /login |

## Comportamentos

- **Não revelar** se email existe ou não (mensagem genérica de sucesso sempre)
- **Resend cooldown** 30s
- **Token de uma vez só** — invalidado após uso

## Responsividade

Mesmo padrão Login/Register.

## A11y

- Confirmação (passo 2) anunciada via `role="status"`
- Botão "Reenviar" tem `aria-disabled` durante countdown
