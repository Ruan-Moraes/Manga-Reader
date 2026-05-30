# ProfileEdit — Editar perfil

> **Componente mais denso do app.** Modal com tabs, formulários complexos, upload de imagem.

## Rota

`/profile/edit` (página dedicada) OU modal sobre `/profile`

> Recomendação: rota dedicada por ser longo. Em mobile, a modal-no-fullscreen funciona melhor.

## Layout em árvore

```
<PageContainer asMain size="narrow" paddingY="md">
├── Header
│   ├── eyebrow "Sua conta"
│   ├── <h1>Editar perfil</h1>
│   └── Sub: "Mudanças são salvas conforme você edita"
│
├── <Tabs> variant="underline"  (ou Sidebar de tabs em ≥lg)
│   ├── Conta
│   ├── Identidade
│   ├── Recomendações
│   ├── Grupos
│   ├── Notificações
│   └── Privacidade
│
└── TabPanel ativo (cards em coluna)
    │
    ├── Conta:
    │   ├── Avatar uploader (file picker, preview, "remover")
    │   ├── Banner uploader (futuro)
    │   ├── Email (Input readonly + botão "alterar")
    │   ├── Senha (botão "Alterar senha" abre Modal)
    │   ├── Excluir conta (Button danger, abre Modal de confirmação dupla)
    │   └── Sair (Button ghost danger)
    │
    ├── Identidade:
    │   ├── Nome de exibição (Input + contador)
    │   ├── Handle (@) (Input com validação live)
    │   ├── Bio (Textarea autoResize, contador 280)
    │   ├── Pronome (Select com opções pt-BR)
    │   └── Localidade (Input)
    │
    ├── Recomendações:
    │   ├── Gêneros favoritos (multi-select de Badges toggleable)
    │   ├── Idiomas de leitura (Checkbox group: PT-BR, EN, JP, KR)
    │   ├── Mostrar conteúdo +18 (Switch)
    │   └── Histórico de leitura (botão "Limpar")
    │
    ├── Grupos:
    │   ├── Lista dos grupos que sigo (cards com botão "deixar de seguir")
    │   └── Solicitação de verificação (form longo se for coordenador)
    │
    ├── Notificações:
    │   └── Switch para cada tipo: novo cap, reply, mention, grupo, system
    │       agrupados por canal (in-app, email, push)
    │
    └── Privacidade:
        ├── Perfil público (Switch)
        ├── Biblioteca visível (RadioGroup: público / amigos / privado)
        ├── Atividade visível (Switch)
        ├── Permitir mensagens (RadioGroup)
        ├── Bloquear usuários (link pra subpágina)
        └── Baixar meus dados (Button — gera JSON e envia por email)
```

## Componentes

`PageContainer`, `Tabs`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`, `Avatar`, `Button`, `Badge`, `Modal`, `Toast`, `Card`, `Label`.

## Estados

| Campo | Estados |
|---|---|
| Input (handle) | idle, checking (debounced 500ms), valid, taken, invalid |
| Avatar uploader | idle, uploading (progress), preview, error |
| Save | save automático debounced 1s; toast de confirmação |
| Erro 5xx | Toast de erro + rollback do campo |
| Excluir conta | Modal de confirmação dupla (digite seu @handle) |

## Comportamentos

- **Auto-save** debounced 1s em campos texto; **save imediato** em toggles
- **Validação inline:** errors aparecem em `<Input error>` após blur ou após save fail
- **Unsaved indicator**: badge "Salvando..." no topo durante save
- **Tab change com edições pendentes**: força save antes; em erro, mantém tab atual
- **Excluir conta**: requer digitar `@handle` exato; confirma com Toast info "Sua conta será removida em 7 dias"

## Responsividade

| Breakpoint | Tabs |
|---|---|
| <lg | Tabs horizontais no topo (scroll horizontal) |
| ≥lg | Sidebar vertical à esquerda (240px) + content flex-1 |

Campos: sempre full-width até 560px (max-width form-field).

## A11y

- `<form>` envolvendo cada TabPanel
- Cada campo tem `<Label htmlFor>` + `aria-describedby` pra hint/error
- Auto-save anunciado via `aria-live="polite"` (não interromper)
- Modal de delete: focus inicial no input do handle, botão delete começa disabled

## Notas críticas de migração

- O componente é longo — quebrar em sub-componentes por tab (`<ProfileEditTabs.Account>`, etc.) com props consistentes
- Migrar tab a tab, não tela toda de uma vez
- Manter o ProfileEdit antigo até que TODAS as tabs novas estejam testadas
