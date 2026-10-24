# Evidência — diagnóstico estrutural offline, 2026-09-27

Parcela de TASK-004 da MOB-FEAT-018, sem concluir qualidade vertical, avaliação
independente ou TASK-005. Estado permanece `in-progress`. Não altera produção,
schema, manifesto OCR, layout, credenciais, infraestrutura ou defaults.

## Implementação e execução local

- `ocr-evaluation.mjs diagnose` e `report --diagnostic`, com parser Java apenas
  em testes, sem inicialização de clients, Spring, JDBC, ADC ou ONNX.
- Inventário dos níveis estruturais, quebras, confiança quando representada,
  geometria original e associação pelo ID estrutural do mapper; descartes explícitos.
- Capturas existentes japonesa histórica e portuguesa processadas offline;
  relatórios em diretórios exclusivos. Arquivos privados não são versionados.
- Nas duas capturas, replay do mapper idêntico ao manifesto e hashes validados.
  Regeneração repetida determinística, com imagem, protobuf, manifesto e relatório
  OCR histórico byte a byte preservados.
- Zero novas chamadas de reconhecimento, downloads, credenciais ou inferência.
  A execução usa bytes anteriormente observados, não resposta sintética nova.

## Achados exploratórios, não referência humana

Na captura japonesa histórica: 46 parágrafos, 208 palavras e 362 símbolos;
quadriláteros válidos nesses níveis. O bloco principal visualmente vertical
apresenta 19 parágrafos e 54 símbolos; 17 parágrafos têm caixas largas.
Há avanço horizontal entre símbolos dentro desses parágrafos. Portanto,
reordenar somente a lista de regiões não resolve a mistura interna.

No controle português: 13 parágrafos, 20 palavras, 62 símbolos, com geometria
válida e replay exato. Não é nova aprovação de qualidade. O controle inglês na
página histórica e inscrições de margem distinguem progressões horizontal e
vertical observáveis; esses indícios não confirmam todo o texto.

Conclusão: posições individuais tornam **plausível investigar** um agrupamento
experimental, mas não demonstram recuperação fiel. Reconhecimento histórico,
furigana, variante do bloco inferior e ordem por bloco exigem revisão competente.
Não houve agrupamento, reordenação, correção de caracteres, CER ou nota.

## Verificação

Comandos reproduzíveis:

```bash
node --test api/apps/translation-gateway/scripts/*.test.mjs
cd api
./mvnw -o -B -pl apps/translation-gateway -am test \
  -Dtest=VisionDiagnosticTest -Dsurefire.failIfNoSpecifiedTests=false
./mvnw -o -B test
cd ../web/toonlira
./node_modules/.bin/tsc -b
cd ../../mobile
pnpm specs:check
```

TDD: o teste Node novo falhou por módulo inexistente antes da implementação.
Fixtures Java sintéticas cobrem orientação mista, símbolos deliberadamente
embaralhados, vertical organizada, anotações pequenas, quebras, confiança ausente,
geometria ausente/inválida, duplicatas versus repetições legítimas, página vazia,
replay divergente, protobuf truncado/excessivo e expansão JSON além do limite.
Testes Node cobrem argumentos, ambiente, reserva concorrente, traversal/symlink,
limites, hashes/proveniência, regeneração e HTML escapado.

Resultados desta execução:

- Node: 49 testes aprovados, incluindo os novos testes diagnósticos.
- Java focalizado: 5 testes aprovados, sem falhas/erros.
- Maven global offline com Docker, reexecutado sequencialmente: `BUILD SUCCESS`,
  2min56s, incluindo gateway completo e Testcontainers.
- Web `tsc -b`: aprovado.
- SDD: 24 testes aprovados, validação de specs e links aprovada; nenhuma renovação
  de checksum necessária (somente review mobile excluída do cálculo).
- Links relativos dos documentos tocados: 33 alvos verificados.
- Prettier direcionado e `git diff --check`: aprovados.
- `pnpm check` mobile complementar: aprovado integralmente, incluindo 109 suítes /
  674 testes. Avisos React `act` de testes existentes não foram alterados fora do escopo.

## Limitações e incidentes

- O primeiro classpath obtido do Surefire tinha separador final vazio; a ferramenta
  o rejeitou antes de reservar a análise. Corrigido removendo entradas vazias,
  sem adicionar o diretório corrente implicitamente ao classpath.
- A primeira suíte Maven global coincidiu com outra compilação no mesmo `target/`:
  houve classes de testes temporariamente ausentes e falhas no harness. Essa
  tentativa não é evidência de aprovação. Reexecução global sequencial requerida.
- A política do navegador bloqueou a abertura automatizada do HTML local. Não
  houve contorno. Renderização visual no navegador permanece para abertura manual;
  estrutura/escape/integridade foram validados programaticamente e a imagem
  original foi inspecionada localmente.
- Hash do helper e do mapper compilado ficam nos metadados; preparar novamente o
  teste Java após mudar código/dependências. Nenhuma instalação implícita.

Próximo gate: apresentar os achados e obter aprovação específica para planejar
reorganização. Não executar essa etapa como parte do diagnóstico.
