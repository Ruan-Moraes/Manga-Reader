# Consolidação do piloto OCR — 2026-09-27

Estado: piloto real revisado e aprovado pelo custodiante no escopo apresentado;
**MOB-FEAT-018 permanece `in-progress`**. TASK-004 e TASK-005 continuam abertas.
Esta consolidação só leu artefatos locais: nenhuma inferência, chamada Google,
credencial, tradução, coleta ou alteração de produção.

## Fatos validados

O [pacote reutilizável](local-samples.md) forneceu 12 imagens licenciadas: as mesmas
duas cenas de Pepper&Carrot em seis idiomas. Cada imagem tem uma rodada OCR real
salva, distinta das simulações anteriores. Foram conferidos hash da imagem,
captura protobuf real, manifesto OCR e layout selecionado. As 12 rodadas têm
OCR `SUCCEEDED`, job `TRANSLATING` e cleanup sem pendências nos relatórios locais.
O estado do job não significa que houve tradução.

| Idioma  | Páginas reais | Regiões na página 1 / 2 | Quadros / balões por página | Decisão do custodiante                   |
| ------- | ------------: | ----------------------: | --------------------------- | ---------------------------------------- |
| pt-BR   |             2 |                 13 / 10 | 3 / 2                       | aprovado no escopo                       |
| en      |             2 |                 13 / 11 | 3 / 2                       | aprovado com achados preservados         |
| es      |             2 |                 13 / 10 | 3 / 2                       | aprovado com ressalva de pontuação       |
| ja      |             2 |                 14 / 10 | 3 / 2                       | aprovado com ressalvas de pontuação      |
| ko      |             2 |                 10 / 10 | 3 / 2                       | aprovado; correção de duplicata aprovada |
| zh-Hans |             2 |                  14 / 7 | 3 / 2                       | aprovado com ressalva de reticências     |

Total observado: **135 regiões**, não 135 falas ou acertos. Contagem não prova
cobertura integral nem precisão. Todas as páginas são horizontais, avaliadas com
direção explícita LTR. Não há evidência real de japonês vertical ou leitura RTL.

Layout é extensão experimental separada: foram selecionadas as análises `1.1`
mais recentes, preservando as históricas. Todas permanecem `partial`, com texto
externo aos balões; nenhuma tem ambiguidade geométrica nesse conjunto. Isso não
equivale a ordem semântica universalmente correta. OCR `1.0` permanece intacto.
Na página coreana 2 houve uma supressão auditável de caixa duplicada, validada na
[regressão local](../layout-dedup-validation-2026-09-27.md); nas outras onze não
houve supressão. Balões são caixas envolventes, não máscaras dos rabichos.

As aprovações foram registradas por lote. São aceites exploratórios do custodiante,
não revisão independente por pessoas competentes nos seis idiomas. Nenhum CER,
nota de qualidade ou percentual de acerto foi calculado.

## Achados e limitações preservados

- **OCR/pontuação:** substituição de pontuação invertida no espanhol; diferenças
  de reticências/pontos no japonês, coreano e chinês simplificado. Na página
  chinesa 1, a inspeção preliminar sugere seis pontos na fala intermediária,
  enquanto a captura contém um U+2026; revisão competente pendente.
- **Segmentação:** falas podem ocupar vários parágrafos/regiões. O layout agrupa
  essas regiões sem concatenar ou modificar o texto original.
- **Ordem:** a lista de grupos mantém a sequência do manifesto/provider e não
  deve ser lida como ordem narrativa. `suggestedOrder` é separado; números são
  referências às regiões originais, não índices narrativos renumerados.
- **Layout:** a duplicata coreana foi corrigida com auditoria, sem nova chamada
  OCR. O limiar de IoU continua experimental; cenas distintas podem revelar
  falsos positivos, sobreposições ou quadros fora da cobertura geométrica.
- **Onomatopeias:** achados históricos, incluindo omissão parcial no inglês,
  permanecem registrados. Sua avaliação específica foi adiada pelo usuário para
  outra spec, ainda sem ID; regiões não foram removidas para obter aceite.
- **Operação:** a evidência usa harness local com PostgreSQL temporário, acesso
  privado ao GCS e provider real. Não comprova deploy do worker, Cloud Tasks em
  produção, integração mobile ou prontidão de uploads públicos. Cleanup local
  sem pendências não elimina eventual armazenamento remoto em soft delete.

## Mapa dos critérios da MOB-FEAT-018

| Critério / tarefa             | Evidência disponível                                                   | O que permanece aberto                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| AC-001 — origem confirmada    | sete hints cobertos offline; seis idiomas exercitados no piloto real   | execução real de zh-Hant e revisão independente                                        |
| AC-002 — regiões estruturadas | 12 manifestos reais íntegros; IDs, ordem, polígonos e hashes validados | referência humana e integração com a etapa seguinte                                    |
| AC-003 — horizontal/vertical  | piloto real horizontal; fixtures sintéticas verticais                  | páginas verticais autorizadas e revisão competente; evidência Android prevista na spec |
| AC-004 — página sem texto     | testes sintéticos/integração do manifesto vazio                        | página genuinamente sem texto, confirmada e processada com autorização                 |
| AC-005 — falha fechada        | testes de timeout, limites, cancelamento, reentrega e transações       | validação operacional; não provocar falhas pagas por esta consolidação                 |
| AC-006 — conteúdo efêmero     | hashes e cleanup por rodada; testes de banco/logs e storage privado    | auditoria operacional completa, retenção/observabilidade em ambiente implantado        |
| TASK-004                      | adapter e piloto reais, com aprovação exploratória                     | benchmark independente e qualidade humana; permanece aberta                            |
| TASK-005                      | preparação parcial de infraestrutura de teste                          | operação completa e gates de produção; permanece aberta                                |

O layout experimental não substitui nem amplia os critérios de aceite OCR.
Os gates de código da correção estão na evidência datada vinculada acima; não
foram reexecutados nem convertidos em evidência de qualidade por esta leitura.

## Lacunas: piloto não é benchmark

Para ampliar a **cobertura de casos do piloto**, faltam pelo menos:

1. Duas páginas horizontais em chinês tradicional (`zh-Hant`).
2. Uma página vertical para cada um de `ja`, `zh-Hans` e `zh-Hant`.
3. Uma página ilustrada genuinamente sem texto.

São seis casos adicionais planejados, não seis arquivos já disponíveis. Novas
fontes, licença, bytes, variante, orientação e autorização precisam ser conferidos;
não converter chinês, girar páginas ou gerar amostras para preencher lacunas.

Separadamente, o [benchmark de 18 posições](catalog.md) continua com **18 posições
planejadas e zero referências independentes revisadas**. As 12 imagens do piloto
não equivalem a 12/18 posições concluídas: repetem duas cenas, não satisfazem a
diversidade de páginas nem estabelecem os pares simples/complexo. Preencher
formalmente o benchmark exige seleção/admissão por posição e anotador/revisor
distintos. Mesmo português ainda não tem referência independente registrada.

## Sequência recomendada — não executada

1. Planejar a seleção dos seis casos ausentes de cobertura, começando por
   chinês tradicional, com materiais autorizados e sem transformação artificial.
2. Definir quais páginas poderão compor o benchmark independente; organizar
   referências e revisores competentes sem contratar ou compartilhar por inferência.
3. Somente após admissão, solicitar autorização por lote para processamento
   remoto/custos. Reaproveitar capturas atuais para diagnóstico sem repetir OCR.
4. Tratar validação operacional de TASK-005 em etapa separada, sem habilitar
   uploads, tradução ou deploy a partir deste aceite exploratório.

Continuam desabilitados por padrão gateway, worker cloud, OCR e layout. Termos,
tradução, publicação e onomatopeias não foram implementados nesta consolidação.

## Rastreabilidade e reprodução

Artefatos detalhados, transcrições e relatórios preenchidos ficam somente na área
local ignorada pelo Git, com índice privado de rodadas. Este documento publica
somente agregados e limitações não sensíveis. Simulações anteriores não entram
na tabela de execuções reais.

A conferência utiliza `loadRun` e `validateLayout`, verificação SHA-256 das imagens
contra `samples.json`, estados e flags de captura real. Não inicializa ADC nem
provider. `ocr-samples.mjs verify` também é offline. Regenerar relatório é leitura
local; `run --mode vision` não é necessário para revisar estas evidências.

## Verificação desta consolidação

- Leitura local das 12 rodadas e dos layouts selecionados, com hashes e estados
  válidos; nenhuma chamada nova ou acesso a credenciais.
- `pnpm check` em `mobile/`: aprovado, incluindo SDD, type-check, lint, FSD,
  formatação e 109 suítes/674 testes Jest. Avisos `act` de testes existentes
  continuam presentes, sem falhas e sem correções fora deste escopo.
- Links relativos dos sete documentos/índice envolvidos: 51 destinos válidos.
- Prettier direcionado e `git diff --check`: aprovados.
- Nenhum runtime, contrato, migration, dependência ou default foi alterado.
  Maven/web da implementação anterior não foram reexecutados nesta consolidação
  documental; seus resultados continuam evidência histórica, não nova execução.
- A única mudança sob `mobile/` é a review da 018, excluída do checksum por
  definição do verificador. Não houve renovação artificial de checksums.
