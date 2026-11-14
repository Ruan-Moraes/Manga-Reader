# Composição nativa dos journals do operador

Data: 2026-10-18. Continuação da
[preparação do operador](worker-isolation-operator-preparation-2026-10-17.md),
sem substituir a implementação server-side pela
[alternativa híbrida urgente](hybrid-rendering-options-2026-10-18.md).
020 permanece `in-progress/open`; 021 bloqueada.

## Parcela implementada

O tooling privado em `.local/worker-isolation/mount-native-journals.ZZMNS7/`
compõe staging, Compute v3, retirada Storage, rota e recuperação parcial usando
os journals Java reais já existentes, sem alteração deles. Não aceita um
Map em memória como substituto da persistência. Cria workspace exclusivo por
rodada, com arquivos 0600/diretórios 0700 e sincronização dos diretórios pais.

Bundles do ciclo precisam corresponder à rodada/janela/fonte verificada no
journal. Rota e recuperação usam contratos próprios; uma falha não cria outro
journal nem retoma a rodada automaticamente. As falhas são sanitizadas.

A factory não possui transporte, SDK, ADC, credencial, admissão financeira ou
operação `execute`. O helper é compilado nos testes a partir do fonte de hash
fixado, com JDK já instalado, e as classes temporárias são removidas ao terminar.
O plano anterior ao código está em `design.md`: exceção explícita de arquivos
privados, sem banco novo, migration ou mudança nos estados do produto.

## Verificação reproduzível

```bash
node --test --test-concurrency=2 .local/worker-isolation/mount-native-journals.ZZMNS7/journals.test.mjs .local/worker-isolation/mount-native-journals.ZZMNS7/supervisor-integration.test.mjs
node .local/worker-isolation/mount-native-journals.ZZMNS7/verify.mjs
```

O segundo comando grava recibo exclusivo e não deve ser repetido sobre uma
rodada já registrada. O primeiro pode ser repetido: só usa diretórios de teste
temporários próprios, removidos ao terminar. Nenhum teste usa rede Google.

Cobertura nova: exclusividade/concorrência, claims CAS entre handles reais,
bindings, fonte não verificada, papéis distintos, corrupção, symlink,
permissões, falha de inicialização sem resume e ausência de portas cloud.
No supervisor, admissão ausente impede até transporte falso; confirmação perdida
do upload seleciona a recuperação parcial com journals reais e sem reupload.

HTTP, tokens, project number, gerações e resultados de montagem das fixtures
são **sintéticos**. Isso não prova boot, IAM, segurança COS ou custo cloud. O
verificador também executa regressões anteriores e confere o snapshot técnico
do gateway e o ledger antes/depois, sem renovar recibos históricos.

Formatação dos arquivos novos e diff direcionado são verificados. O baseline
de formatação de `docs/tech-debt.md` é reportado separadamente, sem reformatar
o histórico inteiro. As duas referências históricas desse arquivo a
`audits/2026-07-02-project-audit.md` já apontam para um caminho ausente; ficam
registradas como pendência, sem aprovação do gate global de links. Todos os
links novos são exigidos. O diff global mantém visíveis alterações externas.
As tentativas iniciais do verificador preservaram seus TAPs; pararam no link
histórico e depois na falta de Node no PATH mínimo do wrapper Prettier. O
bootstrap local foi corrigido para usar o Node já instalado, sem instalação,
herança de credenciais, mudança no SDK ou alteração de validador do produto.
Maven, web, mobile e SDD não são reexecutados por este incremento de tooling
privado/documentação externa às specs; não há nova alegação de gate global verde.

## O que continua faltando

- Composição nativa completa: transporte real limitado, identidade, ports do
  supervisor, tickets de admissão e integração do entrypoint operacional.
- Fechar a revisão COS de montagem mínima e as premissas financeiras/tributárias.
  A cotação anterior é fotografia histórica, não autorização permanente ou teto
  técnico; nenhuma reserva adicional foi consumida nesta parcela.
- Executar e retirar a prova mínima autorizada; depois admitir o worker completo.
  Montagem mínima não executa renderer nem conclui a validação operacional da 020.

`operator.mjs execute` continua bloqueado. Não houve instalação, criação de
recursos, upload, chamada de provider, acesso a credenciais ou mudança de IAM.
Artefatos antigos e arquivos da auditoria de performance não foram alterados.
