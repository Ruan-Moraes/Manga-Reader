# Agrupamento experimental em colunas — avaliação local

Parcela exploratória de TASK-004 / MOB-FEAT-018, que permanece `in-progress`.
Não integra o worker, layout de produção ou manifesto OCR `1.0`. Não recupera
caracteres, traduz ou aprova qualidade. Usa somente um
[diagnóstico existente](offline-diagnostic.md), com cadeia de hashes íntegra.

## Executar somente o experimento aprovado

Node e arquivos locais bastam; não inicia Java, Maven, ADC, Vision, banco ou
modelos. Não instala dependências. A CLI recusa opções cloud e download.

Na raiz do repositório, com perfil privado previamente conferido:

```bash
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs columns \
  --run-id ja-tokyo-puck-real-20260927-a \
  --diagnostic structure-20260927-b \
  --experiment-id columns-20260927-a \
  --profile .local/ocr-samples/columns-ja-main-profile-20260927.json
```

O exemplo identifica a execução histórica autorizada; como o diretório já
existe, nova invocação deve falhar. Não reutilizar o ID, retomar ou sobrescrever.
Uma mudança de parâmetros/escopo requer nova análise e aprovação, não edição da
anterior para fazê-la parecer correta. Não há ajuste automático de parâmetros.

Para atualizar SOMENTE a apresentação dos artefatos salvos:

```bash
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs report \
  --run-id ja-tokyo-puck-real-20260927-a --columns columns-20260927-a
```

Essa regeneração não chama o agrupador. Revalida hashes, contabilidade e relações
salvas, lê `notes.md` e substitui apenas o HTML identificado do experimento.

## Perfil e seleção

O perfil fica dentro de `.local/ocr-samples/`, ignorado pelo Git, limitado a
64 KiB. Diretórios/arquivos simbólicos e traversal são recusados. Campos:

- `version: "1.0"`, `algorithmRevision: "column-candidates-1"`;
- `source`: `runId`, `diagnosticId`, `imageSha256`, `manifestSha256`,
  `rawResponseSha256`, `diagnosticSha256`, `synthetic`;
- `selectionMethod: "manual"` e `selection: [{path, regionId}]`, correspondendo
  exatamente às posições estruturais dos parágrafos retidos do diagnóstico;
- `direction: "vertical-ttb-rtl"` obrigatória — não inferida pelo idioma;
- `parameters`: `centerFraction: 0.5`, `smallRatio: 0.6`,
  `largeGapHeights: 2.5`, `minSymbols: 2`.

A seleção histórica abrange somente o bloco japonês principal escolhido pelo
avaliador. IDs reais, textos, hashes das capturas e perfis permanecem privados.
Não há seleção por coordenadas, ID da amostra ou texto esperado no algoritmo.
Cabeçalho, inglês, margens e bloco inferior não são transformados. A seleção
manual NÃO comprova detecção automática de blocos.

## Regras `column-candidates-1`

1. Inventariar todos os símbolos selecionados, por posição estrutural. Preservar
   originais no diagnóstico; o artefato derivado referencia seus IDs, sem duplicar
   texto. Mesmos caracteres em posições distintas continuam distintos.
2. Revalidar quadriláteros convexos dentro da imagem; geometria ausente/inválida
   fica não resolvida. Token com zero ou vários pontos de código recebe
   `multi-character`, sem divisões ou caixas inventadas.
3. Usar medianas de largura/altura das caixas válidas como escala. Símbolos com
   ambas as dimensões inferiores a 60% das medianas ficam `small-geometry`.
   Podem ser pontuação, anotações ou outra coisa: não confirmar furigana por tamanho.
4. Formar componentes pela sobreposição do intervalo central de 50% da largura X.
   Só aceitar componente se todos os intervalos têm interseção comum. Sem essa
   interseção, marcar `transitive-bridge`, sem divisão ou desempate arbitrário.
5. Exigir dois símbolos para uma coluna candidata; os demais ficam `isolated`.
6. Registrar precedência vertical só se uma caixa termina antes/no início da outra.
   Sobreposição produz ordem parcial. Entre colunas, propor direita → esquerda
   apenas quando os intervalos X completos são separados.
7. Marcar lacunas acima de 2,5 alturas medianas como `large-gap`; não preencher
   texto ou afirmar continuidade de parágrafo através da lacuna.

IDs de colunas e a ordem técnica do JSON não são ordem narrativa. `columnOrder`
ou `order` nulos significam que NÃO foi determinada uma sequência total. Caixas
inclinadas, anexos, espaços e mistura de orientações podem tornar a regra insuficiente.

## Artefatos, limites e recuperação

Reserva atômica: `runs/<run-id>/columns/<experiment-id>/`, privado e ignorado.

- `request.json`: proveniência, versões, Git/dirty, hash do algoritmo e do perfil;
- `profile.json`: cópia exata do perfil usado, não editável para reinterpretar a rodada;
- `columns.json`: candidatos, relações, ambiguidades, escala e inventário completo;
- `result.json`: conclusão técnica e hash do artefato; `failure.json` em falha;
- `report.html` e `notes.md`: comparação e observações separadas.

Diagnóstico até 16 MiB; seleção até 4.096 símbolos; saída JSON até 4 MiB; HTML até
16 MiB. Para limitar expansão quadrática, no máximo 32.768 relações/avisos no
algoritmo. Excesso falha, nunca trunca. Falha mantém a reserva para investigação,
sem retomada/repetição automática. Logs não contêm texto OCR ou exceções brutas.

Cada símbolo selecionado consta exatamente uma vez como associado ou não
resolvido; relações referenciam o inventário sem duplicá-lo. O relatório mostra
tokens numerados e, somente no estado `complete`, concatenação experimental
explicitamente identificada. Não transfere quebras do provider para as novas
colunas; elas continuam no painel original. Nenhum texto consolidado em resultado
`partial` ou `inconclusive`. Ausência de caracteres não é recuperada por reordenação.

`complete` indica apenas resolução pelas regras geométricas; NÃO aprova OCR.
`partial` indica candidatos com pendências; `inconclusive`, nenhum candidato.
Licença/créditos acompanham o relatório, texto é escapado e observações não são
salvas pelo navegador. A ampliação SVG usa a imagem original, sem gerar recorte.

## Validação e ponto de parada

Testes: `node --test api/apps/translation-gateway/scripts/*.test.mjs` na raiz.
Fixtures são sintéticas; nenhuma imagem ou transcrição real entra no Git.
Executar Maven global offline com Docker, web `tsc -b`, SDD/links,
formatação direcionada e `git diff --check`. Não executar builds Maven concorrentes.

Após uma rodada, apresentar divergências e aguardar revisão. Nova chamada OCR,
outro bloco, tuning, recortes, modelos e integração no worker exigem etapa própria.
TASK-004/005 e revisão humana competente permanecem abertas.

[Evidência da primeira execução](experimental-columns-validation-2026-09-27.md).
