# Evidência — controles tipográficos, 2026-09-27

Registro histórico da implementação inicial, posteriormente substituída por
[JavaScript/Java](synthetic-calibration-js-java-2026-09-27.md). Os resultados abaixo
não foram reescritos; comandos atuais estão no [guia](synthetic-calibration.md).

Autorização restrita à preparação local. Nenhuma chamada Vision, credencial,
download, alteração cloud ou custo. A continuidade não significa aprovação
linguística do experimento anterior: o custodiante informou não poder validá-lo.

## Entrega observada

- Dois PNGs RGB 1.200 × 1.200, horizontal e vertical, gerados localmente.
- 16 glifos disponíveis na fonte; mesmos pixels individuais nas duas orientações.
- Referências explícitas de texto, posição, ordem e quebra, sem reconhecimento.
- Inspeção visual local dos PNGs: sem corte, sobreposição ou glifo ausente visível.
- Relatório identifica permanentemente conteúdo sintético e OCR não executado.
- Pillow 12.3.0, FreeType 2.14.3, Python 3.12.14 já disponíveis; fonte local
  Hiragino Sans W3, face 0, não redistribuída.

Imagens, referências e manifesto ficam no diretório privado de calibração ignorado
pelo Git, separado das amostras reais. Hashes, ID e comando efetivo permanecem
localmente. Não foi criada nova posição no catálogo nem resultado de provider.

## Testes e gates

TDD: teste inicial falhou por módulo inexistente antes da implementação.

- Python: 12 testes aprovados, sem skips, com fonte explícita. Cobertura de
  renderização determinística, fonte ausente/inválida, geometria, substituição,
  omissão, repetição, ordem, quebras, limites, adulteração, reserva concorrente,
  symlinks, regeneração e restrição a saídas fabricadas.
- Node: 62 testes aprovados, zero falhas, sem alteração dos testes anteriores.
- Maven global `./mvnw -o -B test` com Docker: `BUILD SUCCESS`, 2min04s;
  módulo gateway com 163 testes, zero falhas/erros/skips.
- Type-check web `./node_modules/.bin/tsc -b`: aprovado.
- SDD `pnpm specs:check`: 24 testes, validação de specs e links aprovadas.
- Regeneração do HTML: nove arquivos locais idênticos antes/depois, incluindo
  referências, imagens, manifesto e relatório.
- Prettier direcionado: aprovado; 26 links relativos nos documentos tocados
  resolvidos. `git diff --check`: aprovado. Bundle confirmado ignorado pelo Git.

As evidências Java/Node são regressão da árvore atual, não execução dos controles
no worker. O teste positivo do comparador usa saída fabricada e não mede qualidade
do Vision. Não houve mudança de runtime, schema, migrations ou mobile.

## Pendências

Reconhecimento real dos controles ainda não executado. Não há prova de qualidade
em mangá, furigana, pontuação vertical, idioma ou material histórico. O relatório
HTML é validado programaticamente; sua aparência não foi conferida em navegador.
Não contornar o bloqueio anterior do navegador para arquivos locais.

MOB-FEAT-018 permanece `in-progress`; TASK-004 e TASK-005 abertas. Nenhum checksum
SDD de arquivo inalterado deve ser renovado. Preparação local não autoriza envio
posterior. Requisitos, comandos e recuperação: [guia](synthetic-calibration.md).
