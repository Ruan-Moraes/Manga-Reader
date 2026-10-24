# Composição concreta do operador de montagem

Data: 2026-10-18. Continuação dos
[journals nativos](worker-isolation-native-journals-2026-10-18.md).
020 permanece `in-progress/open`; 021 bloqueada. O
[estudo híbrido urgente](hybrid-rendering-options-2026-10-18.md) não muda a
implementação server-side vigente.

## Entrega local

O módulo privado em `.local/worker-isolation/mount-composition.eG9gts/` liga
concretamente o supervisor e a factory de journals. O chamador não fornece
journals prontos, factories de ciclo, resultados de montagem ou archive/URL
alternativos. A leitura do archive de runtime é a implementação fixada existente.

As únicas portas externas são clock, credencial, fetch e pausa. Seis admissões
continuam explícitas: raiz, staging, handoff, ciclo, limpeza da fonte verificada
e recuperação parcial. A composição não gera tickets a partir de booleans,
renova prazos, converte permissão de criação em cleanup ou presume cotação aceita.

Configuração, prova, runtime e funções são capturados antes do primeiro await.
Forma inválida falha antes de criar o workspace. Decisão recusada permanece
recusada antes do efeito correspondente. Processamento e cleanup têm sinais
distintos; posse, retenção de capacidade e lifetimes são os do supervisor real.
O objeto público só expõe diretório e `run/close/settled/state`; não contém token.

Não há SDK, ADC ou fetch global por default. O código é composição com portas
explícitas, **não** bootstrap de identidade/transporte reais nem entrypoint cloud
liberado. `operator.mjs execute` continua recusado antes de acessar credenciais.
Nenhuma configuração de runtime, migration, default, Terraform ou arquivo mobile
foi alterado. Os journals anteriores permanecem imutáveis.

## Validação offline e distinção de fatos

```bash
node --test --test-concurrency=2 .local/worker-isolation/mount-composition.eG9gts/composition.test.mjs
node .local/worker-isolation/mount-composition.eG9gts/verify.mjs
```

O primeiro comando pode ser repetido e remove apenas seus diretórios temporários
próprios. O segundo grava um recibo exclusivo; não sobrescreve rodada registrada.
As classes Java usam o JDK já instalado. Não há instalação ou download implícito.

São reais: código do produtor, supervisor, handoff, ciclo v3, retiradas e journals
Java CAS, criação privada de arquivos, locks, hashes e a leitura do archive
fixado. HTTP, credenciais, project number, IDs/gerações, metadata COS e serial
de sucesso são **sintéticos**, fornecidos exclusivamente pelas fixtures.

Cobertura da composição:

- staging → handoff → ciclo → retirada com todos os journals nativos;
- raiz/staging negados sem buscar credencial; configuração inválida sem workspace;
- execução concorrente/repetida sem segundo upload ou segundo ciclo;
- boot 403 persistido como recusa, sem inventar uma operação Google;
- confirmação perdida do upload com recuperação parcial, sem reenviar;
- cancelamento após verificação com cleanup independente e sem criação Compute;
- cleanup negado sem tomar emprestada a admissão de criação;
- fechamento antes do run e proteção contra mutação dos argumentos/funções.

O verificador agrega regressões anteriores, confere os fontes/recibos, snapshot
técnico do gateway e ledger antes/depois, e registra hashes, TAP, links, formato e
diff direcionado. Gates globais não são reexecutados ou declarados aprovados
por uma mudança em tooling privado/documentação externa às Target Specs.
Pendências globais anteriores de links/formatação e diff continuam históricas,
sem reformatar arquivos alheios ou tocar a auditoria de performance.

## Pendências operacionais preservadas

1. Bootstrap nativo de identidade/transporte com limites e ligação ao CLI real.
   Portas injetadas dos testes não são uma credencial ou prova de permissão cloud.
2. Ticket de admissão com revisão COS e custo/tributação aplicável e atual.
   A observação BRL anterior não é autorização permanente; teto de US$ 5 é total,
   e nenhuma reserva nova foi feita por este incremento.
3. Prova real de montagem e retirada, com observações reais. Só depois, admissão
   do worker completo em ambiente compatível com os controles do renderer.

O fluxo verde offline não é boot real, processamento de manga, tradução real,
qualidade aprovada ou conclusão da 020. Não houve chamada autenticada, upload
cloud, alteração IAM, recurso novo ou gasto de provider nesta entrega.
