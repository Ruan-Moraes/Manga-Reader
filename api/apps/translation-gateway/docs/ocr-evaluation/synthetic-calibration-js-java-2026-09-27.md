# Migração dos controles para JavaScript/Java — 2026-09-27

Pedido do custodiante: manter as ferramentas em JavaScript ou Java e informar
qualquer impedimento. Migração local, sem novas dependências, chamadas OCR,
credenciais, downloads, banco ou alteração cloud.

## Implementação

- JavaScript: CLI `prepare`/`report`, reserva exclusiva, arquivos limitados,
  integridade, PNG RGB, referências, comparação e HTML escapado.
- Java: renderização headless com fonte física explícita, sem fallback, usando
  apenas Java2D do JDK. Fonte enviada ao processo local por stdin.
- Python/Pillow deixaram de ser requisitos; os dois scripts anteriores foram
  removidos e substituídos, não mantidos como wrappers ou caminhos alternativos.
- Referências e controles históricos preservados. Leitor JS valida também PNGs
  antigos. Novos controles registram renderer Java2D e ID distinto; pixels entre
  renderers não são presumidos idênticos.
- Comparador continua limitado a saídas fabricadas. Sem qualidade OCR inferida,
  mudança no catálogo, captura real ou aprovação linguística presumida.

## Validação

TDD: suite JS falhou inicialmente por módulo inexistente, antes da implementação.

- `OCR_CALIBRATION_FONT=<fonte-local> node --test api/apps/translation-gateway/scripts/*.test.mjs`:
  74 testes aprovados, zero falhas/skips, incluindo 12 de calibração.
- Casos de regressão: substituição, omissão, repetição, ordem, quebras, geometria,
  IoU poligonal, limites, PNG adulterado, fonte inválida/ausente, face inexistente,
  reserva concorrente entre processos, symlinks, escape e relatório determinístico.
- Novo bundle Java2D preparado localmente, fonte Hiragino Sans W3 face 0. PNGs
  inspecionados diretamente: sem corte ou sobreposição visível; não é validação
  linguística ou OCR. Nenhuma fonte distribuída.
- Bundle anterior: dez arquivos conferidos, inalterados. Novo bundle: nove
  arquivos idênticos antes/depois de regenerar HTML, sem carregar Java ou fonte.
- Type-check web: `./node_modules/.bin/tsc -b` aprovado.
- SDD: `pnpm specs:check` aprovado, 24 testes e links válidos; nenhum arquivo
  coberto por checksum foi alterado, portanto nenhuma renovação artificial.
- Links relativos dos documentos tocados: 21 alvos resolvidos.

A primeira tentativa Maven no sandbox falhou por indisponibilidade do Docker
(cascata de erros de contexto), não por falha do renderer. Reexecução offline com
acesso ao Docker registrada separadamente abaixo; logs brutos não versionados.

Reexecução `./mvnw -o -B test` com acesso ao Docker: `BUILD SUCCESS`, 2min54s,
gateway com 163 testes, zero falhas/erros/skips. Prettier direcionado e
`git diff --check` aprovados. Não houve instalação de dependências.

Os controles Java usam os mesmos caracteres e receita, mas hashes de imagem
distintos do renderer anterior. Evidência de renderização não equivale a
reconhecimento real. MOB-FEAT-018 continua `in-progress`; TASK-004/005 abertas.

Guia e comandos atuais: [controles sintéticos](synthetic-calibration.md).
Evidência anterior preservada: [preparação original](synthetic-calibration-validation-2026-09-27.md).
