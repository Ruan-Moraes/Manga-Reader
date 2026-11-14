# Operador COS73916: preparação offline — 2026-10-21

Continuação da [revisão COS73916](worker-isolation-cos-revision-2026-10-21.md).
O operador está implementado e ligado à composição existente, mas **não houve
execução cloud, credencial utilizada, upload, instalação ou reserva nova neste
incremento**. A 020 continua `in-progress/open`; a 021 e os defaults permanecem
bloqueados/desabilitados. Preparar o operador não conclui a renderização.

## Fluxo e integridade

O candidato privado `mount-n1-operator.xZjwLo` separa coordenação, arquivos,
finanças, prova local e adapters nativos. A sequência é: lock/intenção → pins →
prévia financeira → prova/archive/JDK → cinco pré-requisitos → duas quotas →
ausências anteriores → reconferência → reserva/readback → admissão → composição
→ término/cleanup → relatório. Não há fallback para operador ou imagem anterior.

Conforme `database-design`, reutiliza run ID/hash de plano/bundle como chaves,
ledger em centavos/USD e journals CAS5. Não cria bancos, migrations, índices,
contadores ou caches; nenhum contexto antigo é adotado. Dados têm diretórios
0700/JSON 0600, `wx`, fsync e recusa de symlink. O pai comum existente pode ser
0755, sem escrita de grupo/outros; suas permissões não foram modificadas.

O JDK já instalado compila o helper CAS pinado. Hashes/proveniência ficam no
registro, mas somente `{java, classPath}` atravessa a porta estrita do journal.
O hash de projeto é dependência explícita do coordenador para fixtures;
a fábrica nativa o fixa no valor real, sem override por CLI/configuração.

O operador anterior cobria 22 referências. A nova versão inclui a tentativa
HTTP400 de `20261019-8c3e45ff`: são **33 GETs fixos**, para os três escopos
recentes. Falta, duplicata, ordem divergente, recurso vivo ou expiração de uma
leitura impede reserva. `launch.mjs` também confere localmente a retirada
histórica da primeira tentativa e a ausência de seu lock original.

Depois de entrar no runtime, **contador zero não prova ausência/propriedade**.
Falha desconhecida, perdedor de claim ou trabalho pendente mantém o lock.
Liberação exige quiescência e `activeAbsenceConfirmed=true`, verificadas depois
do término das operações. Abort do processamento não aborta o cleanup separado.
HTTP400 não vira operação DONE/NOT_SENT; seus registros e locks históricos
permanecem preservados. Falha de gravação final também impede liberação ambígua.

## Finanças

`approved-finance.json`, ainda **não criado**, deve usar o formato
`cos73916-financial-inputs-1`, com `prices`/`billing`, cada um com `file` relativo
e `sha256` dos JSON reais. Não há busca automática por arquivo recente.
Ausência, troca, vencimento, hash divergente, symlink, caminho fora do escopo
ou permissão imprópria falha fechado. O snapshot é reconferido antes da reserva.

A cotação N1 deve cobrir exatamente os 15 minutos da janela, dentro da validade
de uma hora; billing BRL deve cobri-la dentro de um dia. Preflight/quota/ausências
precisam estar recentes. Datas alteradas nas fixtures são somente simulação;
a estimativa histórica de USD 2,11 não é cotação nova nem hard cap.

Permanece reserva de USD 5 por tentativa/run ID/hash do plano, sem refund
automático. Criação tem corte em 12 minutos; cleanup, 15 minutos. O ledger
real permanece com quatro reservas, nenhuma nova. Reserva não é gasto faturado.

## Testes e recibos

O gate principal passou em **76 testes**, sem falhas/skips/cancelamentos,
com fontes inalterados e HTTP/CLI reais bloqueados:

- 9 de escopos/33 leituras, 21 do guard e 20 de coordenação;
- 6 de arquivos/lock/JDK, 13 de entradas financeiras e 4 de entry point/prova;
- 3 integrados com admissão concreta, ports nativos, CAS Java e archive locais,
  mas HTTP/identidade/finanças falsos.

A integração cobre sucesso, HTTP400 e upload com confirmação perdida. Somente
sucesso da prova retorna exit 0; os dois casos de falha continuam exit 2, mesmo
com cleanup confirmado/liberação segura. Há REDs preservados. A primeira
integração misturou hash de projeto real e sintético; a dependência foi
explicitada sem tornar o hash nativo configurável. Expectativas dos exits de
falha foram corrigidas, sem reclassificar falha como sucesso.

O gate adicional de lançamento passou em **3 testes**: retirada histórica,
recusa de bytes/lock divergentes e comandos sem efeitos. São gates distintos,
não 79 cenários inéditos. Metadados/datas modelados nas fixtures não são leituras
cloud novas. O coordenador mantém `transportAttested=false`: não atesta as
dependências injetadas. `native-boundary.json` identifica a fábrica/eventos,
não substitui identidade, metadata ou prova efetiva. Seu pinning descreve a
seleção por fontes pinadas, não aprovação operacional. `source419Unchanged=false`
sem conferência final significa não confirmado, não prova de drift.

| Recibo privado       | SHA-256                                                            |
| -------------------- | ------------------------------------------------------------------ |
| Núcleo, 76 testes    | `12935860f95923c679bcf508b70098209946aa5cbe50d2f71bd584268780b1b4` |
| Lançamento, 3 testes | `6ab90bc6270d9644779c408b4c527a17105733a8cfdc06095253cb64238dd159` |

## Comandos e próximo passo

Da raiz do repositório, com Node existente:

```bash
node .local/worker-isolation/mount-n1-operator.xZjwLo/launch.mjs prepare
node .local/worker-isolation/mount-n1-operator.xZjwLo/launch.mjs status <run-id>
```

`prepare` foi exercitado sob bloqueador offline e retornou exit 2, como esperado:
faltam entradas financeiras atuais pinadas. Não houve instalação, reserva ou
prova. `status` não retoma. Não usar operadores E2/Spot anteriores como alternativa.

Próximo: renovar cotação/billing, fixar entradas reais e rever a admissão. Só
então a execução renovará os 40 metadados previstos (5 + 2 + 33), reservará
run ID novo e fará a prova curta dentro do teto autorizado, sem torná-lo teto
técnico do provider. Boot, runtime/CVEs, memória do worker completo, renderização,
qualidade e retenção continuam gates separados. Mount-only não fecha a 020.

Maven global offline com os JDKs/Docker existentes foi reexecutado: todos os
módulos `SUCCESS`, zero falhas/erros; gateway com 1297 testes e 104 skips, sem
considerar os skips verificação real concluída. Type-check web passou novamente.
`pnpm check` mobile integral também passou: 116 suítes/892 testes Jest, com
avisos `act(...)` existentes preservados. Não houve instalação ou correção
automática de arquivos externos ao escopo.

Não houve alteração Java/mobile/performance; o snapshot de 419 fontes do gateway
foi reconferido separadamente, sem apresentá-lo como cobertura do tooling Node.
Links, formatação e diff direcionados são gates próprios. O diff global ainda
aponta a linha em branco preexistente em `PlatformBadge.tsx:44`, fora do escopo.

## Execução posterior

Este documento preserva o snapshot offline. A [primeira rodada nativa](worker-isolation-n1-first-execution-2026-10-21.md)
registra a renovação financeira, reserva, falha antes do POST Compute e retirada
do staging, sem reclassificar esta preparação como aprovação operacional.
