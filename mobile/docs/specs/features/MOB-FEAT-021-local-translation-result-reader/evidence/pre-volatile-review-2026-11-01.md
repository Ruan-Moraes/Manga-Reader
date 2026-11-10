# Histórico anterior à revisão volátil — MOB-FEAT-021 / review.md

> Fotografia preservada em 2026-11-01. Este registro descreve o desenho
> substituído, inclusive seus estados, conclusões e restrições da época. Não é
> contrato vigente nem evidência de implementação do processamento em memória.
> Contrato atual: [spec](../spec.md). Os materiais de prova citados são históricos.

# Review — MOB-FEAT-021

- Spec revisada: `spec.md`, revisão humana de 2026-10-25
- Implementação/revisão: working-tree sha256:640b79285c9494534ee21b64e3df6ccb7d4f9b3f7dd5402650cd2032965d7b17
- Gate na entrada do planejamento: `open`
- Dependências verificadas: 019/026/027/051 em `verification-pending`, admitidas pelo AGENTS.md corrente
- Verdict: `approved`

## Findings

- AC-008/TASK-009 concluídos: matriz física Android, foco TalkBack visível e
  confirmação humana de nomes falados e Ver original, em resposta ao roteiro de
  exploração por gestos. TalkBack desligado, confirmado por leitura ADB.
  Retorno específico ao controle de origem não foi medido nem é declarado como provado.
- Prova de integração delimitada: consulta/ACK/identidade controlados no harness,
  download GCS/arquivos/decoder/SQLite/reader reais. Sem afirmação de gateway
  operacional ou execução única ao vivo com providers. Produção desabilitada.
- A inspeção encontrou e corrigiu FK desligada na conexão exclusiva Expo, ausência
  de ReadableStream no Hermes, perda de controles de overflow no painel e risco
  de apagar artefato após COMMIT ambíguo. Regressões correspondentes preservadas.

- A matriz Android revelou aviso sem texto oculto e copy antiga de READY/preparação;
  corrigidos com regressões trilíngues. Reabertura manual verificada em português.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                                           | Resultado         |
| -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| AC-001   | sim          | useAcquireRemoteTranslationResult: foreground/abort/resume/backoff; controller: estágio persistido monotônico                  | pass automatizado |
| AC-002   | sim          | boundedDownload, parser final, SQLite transação/rollback e recibo nativo de dois HTTPS/REMOTE/FK=1                             | pass              |
| AC-003   | sim          | CAS em SQLite, hook claim antes de navegação; reinícios nativos com claim false                                                | pass              |
| AC-004   | sim          | RNTL REMOTE sem overlay, overflow integral; iOS Ver original/Ver resultado                                                     | pass              |
| AC-005   | sim          | SHA local e zero downloads após retirada remota; original e resultado conferidos no iOS                                        | pass no simulador |
| AC-006   | sim          | testes hash/TTL/truncamento/host/storage/cancel/ACK e commit ambíguo; falhas não publicam READY                                | pass automatizado |
| AC-007   | sim          | parser arte-only e RNTL nos três idiomas, sem região/fallback inventados                                                       | pass automatizado |
| AC-008   | sim          | recursos trilíngues/RNTL/FSD/tokens/labels; Android físico, foco observado e fala/gestos/Ver original confirmados pelo usuário | pass humano       |

Evidência Android: [matriz e limites](android-physical-2026-10-26.md).

Evidência nativa: [recibo sanitizado](native-acquisition-2026-10-25.md).
Arquivos runtime novos classificados individualmente; testes e recibo mapeiam
os oito critérios. Sem mudança de API pública/schema/migration ou vínculo Chapter.

## Gates

| Comando      | Resultado                                                         |
| ------------ | ----------------------------------------------------------------- |
| `pnpm check` | pass — 121 suítes, 953 testes; specs/tipos/lint/FSD/format verdes |

## Mudanças fora da spec

Correção da fundação SQLite compartilhada habilita FKs antes de BEGIN na conexão
real exclusiva; mantém v9 e rollback. Polyfill 4.3.0 condicionado à ausência de
ReadableStream no runtime; versões anteriores preservadas no lockfile.
Checksum ignora `.DS_Store` já ignorado pelo projeto; regressão prova que mudanças
de código continuam sendo detectadas. Nenhum arquivo local foi removido.

## Conclusão

021 `implemented`, todos os critérios e tasks com evidência, review aprovado.
A confirmação humana complementa a matriz automatizada e física sem ampliar o
escopo da prova. A 020 conserva `in-progress` e a publicação permanece desabilitada.
Não confundir reserva financeira com gasto medido.
