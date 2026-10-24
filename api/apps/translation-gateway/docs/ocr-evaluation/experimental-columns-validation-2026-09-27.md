# Evidência — colunas experimentais, 2026-09-27

Implementação e uma execução local aprovadas por Ruan, restritas ao bloco japonês
principal previamente selecionado. Direção explícita `vertical-ttb-rtl`, parâmetros
fixos de `column-candidates-1`. Nenhuma chamada Vision, credencial, imagem nova,
modelo, crop de arquivo, tuning, tradução ou alteração de produção.

## Resultado observado, sem aprovação de qualidade

- Inventário: 54 símbolos, sem perda ou duplicação.
- Três colunas candidatas, com 3, 15 e 3 símbolos: 21 associados.
- 33 símbolos sem associação: dois componentes transitivos não têm interseção
  horizontal comum; não foram divididos arbitrariamente.
- Cinco pares de símbolos sobrepostos, quatro avisos de distância grande e uma
  sobreposição entre colunas. Somente um candidato tem ordem interna total;
  a ordem entre colunas continua indeterminada.
- Estado `partial`; nenhum texto consolidado, caractere corrigido ou recuperação
  de texto alegada. Os candidatos não são colunas humanas confirmadas.

A regra é insuficiente para ordenar com confiança todo o bloco. Ausência de
símbolos marcados pequenos não prova ausência ou leitura correta de furigana.
Revisão competente de japonês histórico e reconhecimento continuam pendentes.
Não foi feita outra execução com parâmetros ajustados à amostra.

Imagem, protobuf, manifesto, metadados, diagnóstico e relatórios históricos:
11 arquivos acompanhados com hashes iguais antes/depois. Artefatos e observações
reais permanecem em diretório privado ignorado pelo Git; nenhum texto real foi
incluído nas fixtures ou neste documento.

## Testes e gates

TDD: teste novo falhou por módulo inexistente antes da implementação.
Fixtures sintéticas cobrem colunas embaralhadas, repetição legítima, ponte
transitiva, ordens parciais, sobreposição, lacunas, pontuação pequena, token
multicaractere, geometria ausente/inválida, limites e seleção explícita.
Testes de arquivos cobrem reserva concorrente, adulteração, symlinks/traversal,
mudança de origem durante execução, falha sanitizada, regeneração determinística
sem agrupamento, contabilidade e escape de HTML.

```bash
node --test api/apps/translation-gateway/scripts/*.test.mjs
cd api
./mvnw -o -B test
cd ../web/toonlira
./node_modules/.bin/tsc -b
cd ../../mobile
pnpm specs:check
```

- Node: 62 testes aprovados, incluindo 13 testes de colunas.
- Maven global offline com Docker: `BUILD SUCCESS`, 1min58s; inclui os testes
  Java existentes do diagnóstico e gateway. Nenhuma compilação concorrente.
- Type-check web: aprovado.
- SDD: 24 testes aprovados, validação de specs e links aprovada.
- Regeneração repetida do relatório: determinística, sem nova execução do
  agrupador; 15 arquivos de origem/artefatos conferidos sem alteração.
- Formatação direcionada: aprovada. Links relativos: 18 alvos válidos nos
  documentos tocados. `git diff --check`: aprovado.

Não houve mudança no mobile ou em arquivos cobertos por checksum SDD; não renovar
checksums inalterados nem conclusões históricas. Este incremento é suporte local
de TASK-004; TASK-004/005 continuam abertas e MOB-FEAT-018 permanece `in-progress`.

## Limites e próximo gate

O relatório HTML é validado programaticamente; sua aparência aguarda abertura
manual. A política do navegador bloqueou arquivos locais na etapa anterior e
não foi contornada. A ampliação SVG não produz imagem recortada ou envio remoto.

Entrega técnica da ferramenta não equivale a sucesso da hipótese de leitura.
Parar para revisão do resultado parcial antes de propor nova regra, outra amostra,
recortes, OCR adicional ou integração no worker. Preservar todos os defaults
desabilitados, contratos, migrations e artefatos originais.

Comandos, parâmetros e recuperação: [guia](experimental-columns.md).
