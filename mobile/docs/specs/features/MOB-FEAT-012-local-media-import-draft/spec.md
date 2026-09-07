---
id: MOB-FEAT-012
type: feature
title: Rascunho de importação de mídia local
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-010]
created: 2026-08-12
updated: 2026-08-12
supersedes: []
superseded_by: []
---

# MOB-FEAT-012 — Rascunho de importação de mídia local

## Objetivo

Permitir que uma pessoa, inclusive guest, escolha explicitamente uma ou várias
imagens pelo seletor do sistema e forme um rascunho privado durável no aparelho,
sem depender da Toonlira Platform, de login ou de acesso permanente à
galeria.

## Contexto e contratos relacionados

- Depende do launcher público de `MOB-FEAT-010`, que está `implemented`.
- Revisa parcialmente `MOB-FEAT-010/AC-003`: `/offline-translation` deixa de ser
  somente um shell indisponível e passa a oferecer importação local real. A
  proibição de HTTP, tradução, progresso e sucesso simulados continua válida.
- Atende RF-IMP-001..003, RF-MED-001..005, RF-PER-001..006, RNF-SEC-001/004,
  RNF-PER-009/010, RNF-CMP-002 e RNF-ACC-001/003.
- Segue `MOB-DEC-002` para evidência baseada em risco e `MOB-DEC-004` para o
  mapeamento FSD da app layer.
- O plano informativo relacionado está em
  `docs/plans/product-implementation.md`; este arquivo é o contrato normativo
  somente para MOB-FEAT-012.

## Requisitos e regras

- `/offline-translation` continua público e apresenta “Traduzir do dispositivo”
  como ação principal, sem exigir sessão ou fazer requests remotas.
- A ação abre o seletor de imagens do sistema somente após gesto explícito. O
  app aceita seleção múltipla, restringe o pedido a imagens e não oferece captura
  por câmera nesta entrega.
- O fluxo deve preferir a seleção pontual do sistema e não solicitar
  `READ_MEDIA_IMAGES`, acesso permanente à biblioteca inteira ou outra permissão
  ampla apenas por conveniência.
- Se uma versão suportada do sistema exigir alguma permissão, o pedido ocorre no
  contexto da ação e a interface explica sua finalidade antes do prompt.
- Somente assets devolvidos pela seleção atual podem entrar no draft. O app não
  percorre, cataloga ou consulta silenciosamente outros itens da galeria.
- Uma seleção bem-sucedida precisa conter `1..N` imagens. O app copia cada item
  para armazenamento privado durável antes de publicar o novo draft como ativo;
  URI externa e `assetId` são apenas entradas transitórias e não podem ser a
  fonte posterior da imagem.
- Existe no máximo um draft de importação ativo nesta etapa. Uma nova seleção
  concluída substitui atomicamente o draft anterior; cancelamento ou falha mantém
  o draft anterior intacto.
- O estado visível informa a quantidade importada e permite selecionar/substituir
  o lote. Não oferece preview detalhado, remoção, reorder, escolha de idiomas,
  processamento ou CTA sem efeito para etapas futuras.
- O resultado pendente do picker deve ser recuperado quando o Android recriar a
  Activity durante a seleção. O mesmo resultado não pode ser importado duas vezes.
- Cópia e leitura de metadados operam por arquivo/stream, sem carregar o conteúdo
  integral de todas as imagens em Base64 ou manter o lote decodificado em memória.
- Nomes originais, URIs, imagens e outros dados privados não entram em logs,
  analytics ou mensagens de erro. Esta feature não adiciona analytics.
- Textos visíveis existem em pt-BR, en-US e es-ES. Cores usam tokens; ações
  possuem labels acessíveis e área de toque compatível com o design system.

## Plano de persistência local

### Banco escolhido

SQLite privado do aplicativo para os metadados relacionais, porque o draft e
seus itens precisam de transação, ordem e integridade local sem servidor. Os
bytes das imagens ficam no diretório privado de documentos do app; banco e cache
não armazenam o binário.

### Modelo em BCNF

`local_media_import_drafts`:

- `id TEXT PRIMARY KEY`;
- `slot TEXT NOT NULL UNIQUE CHECK (slot = 'active')`;
- `created_at INTEGER NOT NULL` e `updated_at INTEGER NOT NULL`, em epoch ms.

`local_media_import_items`:

- `id TEXT PRIMARY KEY`;
- `draft_id TEXT NOT NULL`;
- `position INTEGER NOT NULL CHECK (position >= 0)`;
- `local_filename TEXT NOT NULL UNIQUE`, gerado pelo app e sem nome/URI original;
- `byte_size INTEGER NOT NULL CHECK (byte_size >= 0)`;
- `mime_hint TEXT`, metadado não confiável que não substitui `MOB-FEAT-015`;
- `created_at INTEGER NOT NULL`, em epoch ms;
- `UNIQUE (draft_id, position)`.

As dependências funcionais são `id → atributos`, `slot → draft` e
`(draft_id, position) → item`; todos os determinantes são chaves candidatas.
Não há desnormalização ou campo JSON.

### Integridade, índices e ciclo de arquivos

- `local_media_import_items.draft_id` referencia
  `local_media_import_drafts.id ON DELETE CASCADE`.
- O `UNIQUE (draft_id, position)` cobre as consultas ordenadas e o prefixo da FK;
  não criar índice redundante somente em `draft_id`.
- Novos arquivos são copiados para uma área privada de staging. Somente após
  todas as cópias serem verificadas a transação publica metadados e troca o slot
  ativo. Falha limpa o staging e preserva o draft anterior.
- Após commit, os arquivos do draft substituído são removidos de forma
  recuperável; reconciliação de inicialização remove staging interrompido e não
  apaga arquivo referenciado pelo banco.
- O participante `local-media-import-draft` integra o registry de dados locais
  para medição e exclusão coordenada.
- Não existem contadores ou derivados persistidos nesta feature.

MOB-FEAT-016 poderá migrar um draft confirmado para projeto/páginas sem usar a
URI externa. MOB-FEAT-027 permanece responsável pela estratégia completa de
migration e recovery da biblioteca.

## Arquitetura FSD planejada

```text
shared/media-picker + shared/files + shared/storage
  → entities/local-media-import
    → features/import-local-media
      → pages/offline-translation
        → src/app/offline-translation.tsx
```

- `shared` encapsula APIs do sistema e infraestrutura agnóstica, sem tipos do
  domínio.
- `entities/local-media-import` modela draft, itens e leitura do estado.
- `features/import-local-media` orquestra selecionar, copiar, substituir e
  recuperar resultado pendente.
- A page compõe estado e ações; a rota Expo permanece uma casca fina.
- Cada slice expõe somente sua API pública por `index.ts`; não há imports
  horizontais entre features.

## Casos de erro

- Cancelar o picker retorna ao estado anterior sem criar arquivos, draft vazio
  ou mensagem de erro.
- Picker indisponível, permissão negada quando aplicável ou resultado nativo
  inválido apresenta mensagem localizada e retry, sem crash.
- URI revogada/inacessível durante a cópia, falta de espaço ou falha de I/O
  aborta a nova importação, limpa artefatos parciais e preserva o draft anterior.
- Falha ao limpar arquivos antigos depois do commit não invalida o draft novo;
  fica pendente para a reconciliação local, sem expor paths ao usuário.
- Resultado pendente ausente, já consumido ou duplicado é ignorado com segurança.

## Critérios de aceite

### AC-001 — Entrada local e guest-first

Guest abre `/offline-translation`, encontra a ação principal localizada para
traduzir do dispositivo e consegue iniciá-la sem login ou request HTTP.

### AC-002 — Seleção pontual e múltipla

Ao acionar a importação, abre-se o seletor de imagens do sistema com seleção
múltipla; somente as `1..N` imagens escolhidas explicitamente são recebidas,
sem varredura da galeria ou permissão ampla por conveniência.

### AC-003 — Cancelamento sem efeitos colaterais

Cancelar o seletor mantém o draft anterior e a tela utilizáveis, sem arquivos
novos, estado falso de sucesso ou erro apresentado como falha do usuário.

### AC-004 — Cópia privada e atômica

Uma seleção somente se torna o draft ativo depois que todas as imagens foram
copiadas para armazenamento privado durável e seus metadados foram persistidos;
falha parcial não substitui o draft anterior nem deixa staging ativo.

### AC-005 — Independência da permissão original

Depois do commit do draft, revogar acesso à galeria ou tornar as URIs originais
indisponíveis não impede medir, listar ou abrir os arquivos privados importados.

### AC-006 — Recuperação do resultado Android

Se o Android recriar a Activity enquanto o picker estiver aberto, o resultado
pendente é consumido no máximo uma vez e produz o mesmo draft que o retorno
normal; cancelamento ou ausência de resultado não altera o estado.

### AC-007 — Estado honesto do draft

Após sucesso, a tela informa a quantidade importada e permite substituir a
seleção; não exibe preview/reorder, tradução, progresso ou continuação fictícia.

### AC-008 — Falhas recuperáveis e privadas

Picker indisponível, permissão negada, URI inacessível, armazenamento sem espaço
e falha de cópia produzem estado localizado com retry, preservam dados anteriores
e não expõem nome, URI, path ou conteúdo privado.

### AC-009 — Memória limitada

Importar múltiplas imagens, inclusive arquivos grandes, copia um item por vez e
não converte o lote para Base64 nem mantém todas as imagens decodificadas em
memória.

### AC-010 — Interface acessível e trilíngue

Ação, quantidade, estados e erros possuem paridade pt-BR/en-US/es-ES, labels
acessíveis, alvos de toque adequados e tokens de tema, sem texto ou cor visível
hardcoded.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                    |
| -------- | --------------------------------------------------------------------------- |
| AC-001   | RNTL da page guest e teste que prova ausência de cliente HTTP               |
| AC-002   | Integração com adapter fake e inspeção Android/config de permissões         |
| AC-003   | Teste de cancelamento com draft anterior e filesystem fake                  |
| AC-004   | Integração SQLite/filesystem de commit, rollback e staging                  |
| AC-005   | Integração que invalida URIs de origem após a cópia                         |
| AC-006   | Teste do pending result e execução real Android com “Não manter atividades” |
| AC-007   | RNTL de quantidade/substituição e ausência de controles fora do escopo      |
| AC-008   | Testes parametrizados de erros, preservação e sanitização de mensagens      |
| AC-009   | Teste do contrato sequencial/sem Base64 e profiling em aparelho modesto     |
| AC-010   | RNTL de i18n/semântica/tema e revisão de área de toque                      |

As duas verificações em aparelho (`AC-006` e profiling de `AC-009`) são
obrigatórias para `implemented`. Código completo sem essas evidências usa
`verification-pending`.

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-010`
- Motivo: `MOB-FEAT-010` está `implemented`; não existe dependência de provider
  remoto para importar e persistir localmente.

## Fora de escopo

- Preview detalhado, adicionar/remover item, aviso de duplicidade e reorder
  (`MOB-FEAT-013`).
- Seleção de origem/destino (`MOB-FEAT-014`) e validação de assinatura,
  formato, dimensão, corrupção ou texto (`MOB-FEAT-015`).
- OCR, tradução, upload, consentimento remoto, renderização e reader local.
- Biblioteca final, múltiplos projetos, sync, backup, conta ou mudanças na Core.
- Câmera, documentos/PDF, URL import e browser integrado.
- Analytics e telemetria de conteúdo.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-12

Aprovação humana registrada; a feature está liberada para planejamento e
execução enquanto o gate permanecer `open`.
