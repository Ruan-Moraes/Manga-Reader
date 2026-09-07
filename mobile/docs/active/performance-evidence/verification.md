# Verificação histórica da entrega documental inicial

Este registro corresponde à etapa anterior às correções C01–C05. Suas contagens,
hashes e declarações de runtime preservado valem somente para aquela entrega.
O [relatório consolidado](../performance-audit.md) apresenta o estado atual; os
reviews da [primeira](corrections-2026-09-06/review.md) e da
[segunda rodada](corrections-c02-c05-2026-09-06/review.md) registram as alterações
funcionais posteriores. Os resultados históricos abaixo permanecem preservados.

Data: 2026-09-05. Nenhum código funcional, schema, dependência ou configuração de
runtime foi alterado por esta tarefa. Comparação SHA-256 de todos os 406 arquivos
inventariados confirmou igualdade com o início da auditoria; diferenças Git nesses
arquivos são anteriores à entrega.

## Execuções

- Baseline: `pnpm check` no mobile passou, 95 suítes e 553 testes. Log de trabalho:
  `/private/tmp/mobile-performance-baseline-check.log`. Avisos de act de icon loading
  apareceram, sem falha; não são classificados como regressão de performance.
- Experimento histórico: o script local `reproduce.js` passou (não versionado);
  resultado versionado em `response-limit.json`. Sem HTTP real ou mídia privada.
- Primeiro gate após documentos identificou seções obrigatórias ausentes na ADR
  e invalidou checksums globais antigos por inclusão de documentos. Seções corrigidas.
  A invalidação decorre de `implementationChecksum` incluir `docs/`, não de mudança
  funcional. Reviews/drifts recebem somente rebase documental com nota explícita,
  sem mudar verdicts, ACs, datas ou afirmar nova execução física.
- `quick_validate.py` não executou no Python do host nem no runtime empacotado por
  ausência de PyYAML. Validação estrutural alternativa usa o parser YAML já instalado
  no mobile, sem instalação de dependência; nome, descrição e links verificados.
- Revisão de cenários da skill feita pelo autor, não por avaliador independente:
  memoização geral deve exigir evidência; gate blocked deve impedir implementação;
  falta de dispositivo deve manter pendência; mudança documental não exige benchmark.
  Instruções foram conferidas para esses quatro resultados, sem alegar teste de IA.

## Resultado final — fechamento documental em 2026-09-06

- `pnpm check`: exit code 0; specs, typecheck, lint, FSD, format e testes passaram.
  Resultado da suíte: 95 suítes, 553 testes, zero snapshots, 20,181 s. Esse tempo
  é duração do runner Jest, não métrica de desempenho do app.
- Experimento do transporte reexecutado: resultado JSON idêntico ao versionado.
- Links relativos dos entregáveis verificados; nenhuma referência local quebrada.
- `git diff --check` nos documentos: sem problemas de whitespace.
- Conjunto dos 406 arquivos de `src` e respectivos hashes preservados. `package.json`,
  lockfile e `app.json` também iguais ao snapshot inicial. Hash do inventário confere.
- A09 concluída para consistência documental e gates. A02 e as medições nativas de
  A03–A06 permanecem abertas; nenhuma correção funcional foi executada.

Logs de trabalho: `/private/tmp/mobile-performance-final-check.log` e
`/private/tmp/mobile-performance-format-check.log`; podem ser removidos pelo sistema.
Resultados relevantes estão registrados acima. Após este registro, renovar o
checksum documental e reexecutar apenas specs/format, pois runtime não mudou.

## Limites preservados

Profiling físico, baseline de frames/CPU/memória e validação nativa dos cenários
permanecem abertos no protocolo. Baseline funcional não implica performance aprovada.
