# Tasks — MOB-FEAT-021

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open` (2026-11-18)
- Dependências implementadas: `MOB-FEAT-020` (`verification-pending`)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                   |
| -------- | ------------------ | --------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-004 | Jest do controller (estágios observados) e RNTL do painel com a barra |
| AC-002   | TASK-002, TASK-003 | Jest do parser, do repositório e do controller com falhas injetadas   |
| AC-003   | TASK-004           | Jest do controller e RNTL do painel contando navegações               |
| AC-004   | TASK-003           | Repositório grava `REMOTE` lido pelo leitor local existente           |
| AC-005   | TASK-003           | Resultado persistido continua legível sem rede (leitor local)         |
| AC-006   | TASK-002, TASK-003 | Jest com hash, host, tamanho, manifesto e estados terminais hostis    |
| AC-007   | TASK-002           | Jest do parser com manifesto sem regiões                              |
| AC-008   | TASK-004, TASK-006 | RNTL nos três locales; matriz física Android pendente                 |

## Checklist

- [x] TASK-001 — Acompanhar tentativas aceitas só em foreground, com backoff de 2 s a 30 s, observando o estágio
      remoto e reconciliando ao voltar ao app.
- [x] TASK-002 — Validar o resultado `READY` como entrada hostil: download HTTPS do host assinado, tamanho, MIME,
      dimensões e SHA-256 da imagem; manifesto do render `1.1` com hash, job, idiomas, imagem e regiões.
- [x] TASK-003 — Gravar arquivo e resultado `REMOTE` com regiões numa transação; a página vira `READY` só depois
      do commit. Enviar o ACK depois e retomá-lo até ser aceito, sem desfazer o resultado local.
- [x] TASK-004 — Barra de cinco estágios, abertura automática única com `auto_opened_at` gravado antes de
      navegar, estados terminais sem navegação e i18n nos três idiomas.
- [x] TASK-005 — Gates focados, `typecheck`, `lint:fsd`, `specs:check` e mapeamento no `coverage.json`.
- [ ] TASK-006 — Verificação física Android e ponta a ponta contra o gateway com URLs assinadas reais.

## Riscos e bloqueios

- O gateway local de desenvolvimento não assina URLs de `storage.googleapis.com`, então a ponta a ponta exige o
  ambiente com GCS.
- A 022 reaproveita este ciclo por página. Não acrescentar fila aqui.
