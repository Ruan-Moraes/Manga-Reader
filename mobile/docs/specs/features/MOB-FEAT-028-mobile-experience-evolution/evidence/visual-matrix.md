# Matriz visual — MOB-FEAT-028

## Cobertura automatizada

| Dimensão | Classe esperada    | Colunas de review | Estado                     |
| -------- | ------------------ | ----------------: | -------------------------- |
| 320×568  | compact            |                 1 | coberto por teste unitário |
| 390×844  | regular            |                 2 | coberto por teste unitário |
| 600×960  | medium             |                 2 | coberto por teste unitário |
| 840×600  | expanded/landscape |                 4 | coberto por teste unitário |

Também são cobertos por testes: derivação das cinco etapas, ausência de salto de
pré-condições, semântica do progresso, estados compartilhados, continuidade da
página lógica do reader e paridade das traduções existentes.

## Matriz física pendente

Os critérios da segunda passagem visual foram consolidados nesta evidência e nas
specs: composição editorial, hero geométrico, títulos de impacto, módulos
compactos, drop zone tracejada e grade de páginas sem card externo redundante.
A matriz abrange launcher, seleção, organização, validação, revisão,
autenticação, configurações, aparência e leitor.

A tentativa de abrir a implementação pelo Expo Web chegou ao bundler, mas a
renderização SSR foi bloqueada pelo resolvedor do Metro para o WASM transitivo do
`expo-sqlite`. Como o alvo do produto é nativo e não foi adicionada uma exceção de
storage apenas para a auditoria, a captura da implementação continua pendente em
simulador/dispositivo.

A verificação em simulador ou aparelho deve registrar, sem comparação pixel a
pixel:

- tema claro, escuro e alto contraste;
- font scale normal e 200%;
- loading, vazio, erro, aviso, sucesso, seleção, foco, pressionado e desabilitado;
- larguras 320, 390, 600 e 840, incluindo 840×600 em paisagem;
- teclado e safe areas nas telas de formulário;
- leitor antes/depois da rotação e da abertura dos controles.

Essa etapa permanece aberta porque este ambiente não oferece uma sessão real de
simulador/dispositivo. Até sua execução, AC-010 e AC-016 são `pending` e a spec
permanece `verification-pending`.
