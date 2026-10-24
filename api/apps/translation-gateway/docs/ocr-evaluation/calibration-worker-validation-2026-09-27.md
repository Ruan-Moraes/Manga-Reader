# Evidência — controles integrados ao worker, 2026-09-27

Escopo autorizado: implementar e validar localmente o caminho de calibração,
em JavaScript/Java, sem Google, credenciais ou custos. Nova entrada separada
do catálogo real; worker, migrations V1–V3, APIs, task e defaults preservados.

## Implementação e limites

Admissão independente no Node/Java, hash de referência e imagem, reserva exclusiva,
lock durável, captura protobuf e replay do mapper antes da comparação. Medidas
separam sequência, texto associado, geometria, ordem e quebras/prefixos. Nenhuma
heurística nova para corrigir a página histórica ou qualidade linguística presumida.

TDD: testes Node falharam por módulo ausente e testes Java por classe ausente
antes da implementação. Validação com PostgreSQL 17 e gRPC falso, sem cliente
Google/ADC, incluindo falhas e reentrega. A fixture não é derivada dos glifos.

## Resultados e gates

- Duas rodadas locais, horizontal e vertical, com resposta simulada independente
  da referência: ambas `OCR=SUCCEEDED`, job `TRANSLATING`, uma chamada gRPC falsa
  por rodada, reentrega sem segunda chamada e `cleanupPending=false`.
- Comparação em ambas: sequência divergente, zero símbolos associados, 16
  referências sem correspondência e um símbolo recebido sem geometria válida.
  É o resultado esperado da frase fictícia do harness, não falha observada do
  Vision nem OCR dos caracteres desenhados.
- Regeneração: 11 arquivos por rodada idênticos antes/depois; HTML determinístico,
  sem Java, provider ou reescrita das capturas. Bundle original continua íntegro.
- Node: 85 testes aprovados, sem skips, com fonte explícita na suite de renderização.
- Java focalizado: 11 testes novos aprovados; admissão, integridade, ausência de
  clientes cloud/ADC offline, reentrega, concorrência, cancelamento, timeout,
  falha de upload, rollback e confirmação perdida.
- Type-check web: aprovado. SDD: 24 testes, specs e links aprovados.

Comandos, formatos e recuperação: [guia](calibration-worker.md). Arquivos privados
não entram no Git. A rodada horizontal precedeu a adição do hash agregado do
tooling à request; possui Git/versões e cadeia de hashes de entradas/captura.
A vertical já registra também `toolingSha256`. Nenhuma request foi reescrita para
acrescentar retrospectivamente uma evidência que não continha.

Primeira regressão global: sete falhas na nova classe de integração, após a classe
anterior encerrar o container e deixar o contexto Spring em cache. Focalizado
isoladamente passava. Corrigido o harness compartilhado exclusivamente de testes
com `@DirtiesContext(AFTER_CLASS)`: cada classe encerra seu contexto junto do
container, sem reutilizar datasource antigo. Regressão conjunta das duas classes
e da admissão: 26 testes, zero falhas/erros/skips, 14,353 segundos. Nenhum teste
removido ou gate ignorado; produção permanece inalterada.

Prettier direcionado, 33 links locais e `git diff --check` aprovados.
Reexecução Maven global final `./mvnw -o -B test` com Docker: `BUILD SUCCESS`,
3min06s. Gateway: 174 testes, zero falhas/erros/skips, incluindo as duas classes
do harness no mesmo processo. Nenhuma execução real OCR ou credencial usada.

## Continuidade

Parcela de suporte de TASK-004. MOB-FEAT-018 permanece `in-progress` e TASK-004/005
abertas. Nenhum checksum de arquivo inalterado é renovado. O teste real dos dois
controles continua pendente de autorização específica; aprovação de continuidade
não substitui autorização para upload, credencial ou custo. O custodiante não
precisa validar japonês: revisão linguística competente permanece pendente.
