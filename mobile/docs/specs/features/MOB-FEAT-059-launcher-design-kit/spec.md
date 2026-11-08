---
id: MOB-FEAT-059
type: feature
title: Início no padrão do kit mobile
status: draft
implementation_gate: open
blocked_by: [MOB-FEAT-057]
created: 2026-11-08
updated: 2026-11-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-059 — Início no padrão do kit mobile

## Objetivo

Levar a tela inicial (`/`) ao padrão validado no kit mobile do Toonlira Design System: cabeçalho de página com
hierarquia clara, cartões de módulo que mostram o estado real de cada módulo, uma explicação honesta da plataforma em
construção e um atalho para a biblioteca local, que hoje só é alcançável de dentro do fluxo de tradução.

## Contexto e contratos relacionados

- **Altera MOB-FEAT-010/AC-002** (cartões e ações dos módulos): passam a valer os AC-002 a AC-004 desta spec. Os
  demais AC da 010 (entrada pública, shell offline honesto, plataforma autenticada, return-to seguro, navegação,
  status conectado e i18n) continuam vigentes.
- Mantém os dois módulos da 010 (Traduzir capítulo e Plataforma de leitura); não funde Início e Biblioteca como o
  DESIGN-BRIEF propunha (decisão D8).
- Usa primitivas da MOB-FEAT-057 (`BottomSheet`, `TextAction`, tokens de medida).
- Referência visual: `LauncherScreen.jsx` (kit, versão 42).

## Requisitos e regras

### Cabeçalho

- Barra de marca como hoje: logo, "Toonlira" e o botão "⋯" que abre Configurações.
- Cabeçalho de página: eyebrow (papel `eyebrow`, tom de acento), título no papel `display` e texto de apoio no papel
  `body`, tom muted. O título deixa de usar o papel `title`.
- Imagem de destaque em proporção 16:9, raio `card` e borda `separator`, com as versões clara e escura atuais.
- O aviso de erro de hidratação local (`StatusMessage` com "tentar novamente") continua como está.

### Cartões de módulo

- Altura mínima de 88, padding `md`, superfície neutra com borda `separator` e raio `card`; pressionado em
  `surfacePressed`.
- Tile de ícone `feature` (48) em `accentSoft`, ícone de 24; título no papel `section`; descrição no papel `caption`,
  tom muted; chevron de 20.
- Linha de status com ponto de 6 e texto `caption`, refletindo a disponibilidade real:
    - Traduzir capítulo: "Local-first", tom de acento.
    - Plataforma de leitura: "Em construção", tom de aviso, enquanto a plataforma não estiver liberada.
- Tocar em "Traduzir capítulo" abre o fluxo de tradução, como hoje.

### Plataforma em construção

- Tocar em "Plataforma de leitura" abre uma folha ("Estamos preparando a plataforma") com um texto curto explicando
  que catálogo, leitura, comentários e avaliações só serão liberados quando estiverem completos.
- A folha tem a ação primária "Entrar na plataforma" e a secundária "Agora não":
    - Visitante: "Entrar na plataforma" fecha a folha e abre o login com retorno seguro para `/platform/status`
      (mesmo destino e allowlist da 010/AC-005).
    - Usuário autenticado: "Entrar na plataforma" fecha a folha e abre `/platform/status`.
    - "Agora não", o fechar, o scrim e o voltar do Android só fecham a folha.

### Biblioteca local

- Abaixo dos cartões, a ação textual "Abrir biblioteca local" abre `/translation-library`.

### Desenvolvimento

- O atalho de preview de novel continua existindo apenas em `__DEV__` (decisão D13); em build de usuário não
  aparece.

### i18n, tema e acessibilidade

- Textos novos (status dos módulos, título, texto e ações da folha, ação da biblioteca) em `launcher` nos três
  idiomas.
- Cores e medidas vêm de tokens; cartões e ações têm rótulos e papéis acessíveis e alvo mínimo da plataforma.

## Casos de erro

- Hidratação local falhou: o aviso com "tentar novamente" aparece e os cartões continuam alcançáveis, como hoje.
- Sessão expirada entre abrir a folha e tocar em "Entrar na plataforma": vai para o login, nunca para conteúdo privado.

## Critérios de aceite

### AC-001 — Cabeçalho da página

Dado o Início, quando renderizado, então mostra marca com acesso a Configurações, eyebrow, título no papel `display`,
texto de apoio e imagem 16:9 com raio de cartão.

### AC-002 — Cartões com estado real

Dados os dois módulos, quando renderizados, então cada cartão mostra tile de 48, título, descrição, status verdadeiro
com ponto colorido e chevron, com altura mínima de 88 e alvo acessível.

### AC-003 — Plataforma explicada em folha

Dado um toque em "Plataforma de leitura", quando a folha abrir, então mostra a explicação, "Entrar na plataforma"
leva visitante ao login com retorno seguro e usuário autenticado ao status, e "Agora não", fechar, scrim e voltar só
fecham a folha.

### AC-004 — Atalho da biblioteca

Dado o Início, quando o usuário tocar em "Abrir biblioteca local", então a biblioteca local abre.

### AC-005 — Itens de desenvolvimento

Dado um build com `__DEV__` falso, quando o Início renderizar, então nenhum atalho de desenvolvimento aparece.

### AC-006 — Idiomas, tema e acessibilidade

Dados os três idiomas, claro, escuro, alto contraste, fonte a 200% e 320 pt de largura, quando o Início e a folha
renderizarem, então não há texto fixo, cor solta, corte ou ação inalcançável.

### AC-007 — Contratos preservados e qualidade

Dados os AC-001 e AC-003 a AC-008 da MOB-FEAT-010, quando os testes rodarem, então continuam verdes, e os testes da
página, i18n e FSD desta spec passam, com arquivos mapeados no `coverage.json`.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                            |
| -------- | ----------------------------------------------------------------------------------- |
| AC-001   | RNTL do `ModuleSelector` (papéis tipográficos, proporção da imagem)                 |
| AC-002   | RNTL do `AppModuleCard` (status, tile, altura mínima)                               |
| AC-003   | RNTL da folha para visitante e autenticado; fechar por cada meio                    |
| AC-004   | RNTL da navegação para a biblioteca                                                 |
| AC-005   | RNTL com `__DEV__` falso                                                            |
| AC-006   | Teste de chaves nos três locales; RNTL com `fontScale` 2; capturas no iOS Simulator |
| AC-007   | Testes existentes da 010 verdes; `pnpm lint:fsd`, `pnpm typecheck`; `coverage.json` |

## Gate de implementação

- Estado: `open`
- Dependências: MOB-FEAT-057 (`verification-pending`, primitivas executadas).

## Fora de escopo

- Fundir Início e Biblioteca, mudar rotas ou abrir as abas da plataforma.
- Mudanças no `PlatformStatusPage`, no login ou na allowlist de retorno.

## Pontos em aberto para a aprovação

- **D8 — Início separado da Biblioteca.** Proposta: seguir o kit (Início com dois módulos e atalho para a biblioteca).
- **D13 — atalho de preview de novel.** Proposta: manter só em `__DEV__`, como hoje. A alternativa é removê-lo do
  Início e deixar o preview acessível apenas pela rota de desenvolvimento.

## Aprovação humana

- Aprovador: pendente
- Data: pendente

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
