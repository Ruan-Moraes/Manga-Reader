# Coleta HTTP e recuperação da retirada mínima — 2026-10-15

## Resultado e escopo

Continuação do [binding e pré-flight](worker-isolation-mount-binding-2026-10-15.md).
Implementados adapters HTTP de leitura e retirada Compute, mais journal local
durável e recuperação conservadora. Exercitados **somente com API falsa e IDs
sintéticos**, sem credenciais, consultas autenticadas, VM, upload ou exclusão
cloud nesta parcela. Tooling JavaScript em
`.local/worker-isolation/mount-transport.XgBcjD/`, ignorado pelo Git.

A 020 permanece `in-progress/open`, 021 bloqueada e defaults desabilitados.
Não existe aprovação operacional do worker, autorização nova de instalação
ou consumo do slot financeiro remanescente. Runtime, banco e mobile intactos;
nenhum arquivo da auditoria de performance foi alterado.

## Coletor de configuração

`reader.mjs` implementa o transporte esperado pelo coletor anterior. Recebe
explicitamente credencial/fetch/clock; não inicializa SDK, ADC ou rede no import
ou na criação do adapter. Uma string de confirmação local evita uso acidental,
mas **não substitui autorização humana nem valida identidade Google**.
O futuro executor deve reaplicar os pins de identidade/projeto, TLS e integridade
do SDK do pré-flight; essa conexão com a CLI não foi executada nesta entrega.

Endpoints HTTPS fixos do Compute, projeto `toonlira-rm`, zona São Paulo e recursos
do contrato. Não aceita URL arbitrária. GETs completos de VM, discos, imagens,
rede/subnet e metadados do projeto; firewalls efetivos de `nic0`; rotas globais,
roteadores e espelhamentos agregados. As listas são coletadas antes de selecionar
a rede do teste: filtro local não pode ocultar uma segunda página relevante.

Até oito páginas e 4.096 entradas por lista, token opaco limitado e sem repetição.
`returnPartialSuccess=false`; `unreachables`, warning inesperado, envelope
desconhecido, grupo ambíguo ou erro HTTP interrompem a leitura. Ausência não
comprovada não vira array vazio. Warning documentado `NO_RESULTS_ON_PAGE` é
aceito somente na estrutura prevista, sem misturá-lo com a lista do mesmo grupo.
Espelhamento encontrado na rede própria impede a validação.

Cada snapshot/serial tem deadline de dez segundos, inclusive aquisição da
credencial, corpo limitado a 1 MiB e cancelamento propagado. O binding anterior
mantém seus limites totais de tempo/cursor/serial e compara snapshots completos
antes/depois. Snapshot é observação composta, **não transação atômica da cloud**.
Nenhuma falha é repetida automaticamente. Erros não contêm resposta bruta,
metadados, token ou identidade pessoal.

Fontes: [roteadores agregados, paginação e respostas parciais](https://docs.cloud.google.com/compute/docs/reference/rest/v1/routers/aggregatedList),
[espelhamentos agregados](https://docs.cloud.google.com/compute/docs/reference/rest/v1/packetMirrorings/aggregatedList)
e [firewalls por interface](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/getEffectiveFirewalls).
Testes preservam o binding anterior e sua classificação
`injected-transport-only`, nunca filesystem observado ou aprovação cloud.

## Retirada Compute e journal

`retirement.mjs` deriva oito alvos exatos: VM → dados → boot, se não removido
automaticamente → imagem → subnet → dois firewalls próprios → rede.
Exige IDs decimais em strings, nomes distintos e ownership por labels ou
descrição exclusiva da rodada. O plano deverá vir de recibos reais de criação,
não das fixtures. Mudança de configuração segura não impede retirar o recurso
próprio; mudança de identidade ou disco com usuário impede a exclusão.

`openJournal` exige diretório canônico privado, proprietário atual, sem symlink,
e vincula o plano pelo SHA-256. Usa arquivos exclusivos `O_EXCL/O_NOFOLLOW`, modo
0600, fsync do arquivo e do diretório. Contexto, intenção, tentativa, operação e
ausência não são sobrescritos. UUID v4 é reservado por alvo antes da mutação.
Em disputa, uma leitura pode encontrar intenção incompleta: falha conservadora,
sem interpretar erro de leitura como permissão de repetir a ação.

`retirement-http.mjs` só acessa alvos do plano e operações vinculadas ao journal.
Reconsulta identidade imediatamente antes de cada DELETE, exige intenção
durável correspondente e registra tentativa exclusiva antes do envio. Uma
segunda instância do adapter não pode reenviar a tentativa. Sem redirect,
retry automático, URL de operação arbitrária ou erro bruto em logs.

O orquestrador reconsulta a ausência dos predecessores antes de cada etapa e
faz nova varredura final dos oito alvos. `DONE` ou VM parada não bastam:
sucesso exige GET 404 dos alvos ativos. Operação deve corresponder a escopo,
targetLink, targetId, operationType e clientOperationId da tentativa.

Recuperação testada:

- Resposta perdida e recurso já ausente: confirmar 404, sem novo DELETE.
- Recurso presente com operação conhecida: consultar somente o handle pinado.
- Recurso presente e confirmação/handle perdido: manter pendência, sem repetir.
- Recurso recriado com mesmo nome: bloquear; recibo antigo não autoriza removê-lo.
- Cancelamento, journal adulterado ou operação divergente: falhar sanitizado,
  preservando a intenção anterior e os demais recursos.

**Limites importantes:** GET anterior não é CAS de DELETE; existe janela entre
leitura/envio se outro operador recriar o recurso. Não há aprovação para operar
concorrentemente sobre esses nomes. O controle reduz e detecta drift, não prova
impossibilidade de corrida com terceiros. Campos estritos ainda precisam ser
confrontados com respostas reais; não se normalizarão silenciosamente ausências
ou valores divergentes para liberar o teste.

Retirada de bucket/objeto/generation e soft delete **não faz parte deste novo
orquestrador**. Resultado mantém `storageRetirementConfirmed=false` e
`physicalDeletionVerified=false`. Deve ser conectado ao lifecycle de staging já
existente, preservando generation/preconditions e retenção. Também não cria
recursos, não recupera inserts ambíguos e não é um executor cloud completo.

## Host, preço e decisão de não criar

Consultas públicas de documentação não preencheram as lacunas das receitas
pinadas COS que antes retornaram 401. A documentação oficial confirma
[cloud-init por user-data e criação de unidades](https://docs.cloud.google.com/container-optimized-os/docs/how-to/create-configure-instance),
mas não atesta ordem de boot ou binários desse build específico. Portanto não
resolve o finding Docker nem aprova o host para pull ou worker.

Mantidos os dois slots históricos do ledger; nenhuma reserva ou chamada
autenticada nova nesta entrega. O envelope anterior de US$ 0,66 permanece
**provisório**, não foi redatado como cotação completa nem tratado como teto de
cobrança. Não se inferiu fatura zero ou ausência de custo residual de soft delete.

Antes da rodada mínima ainda são necessários:

1. Revisão de ameaça do COS e comportamento de boot/utilitários no escopo mínimo,
   sem transferir aprovação para OCR/Java/codec/pull.
2. Integração criação/recuperação/retirada Compute + staging, com recibos reais,
   identidade pinada e acompanhamento até ausência comprovada.
3. Cotação/envelope completo e admissão no ledger compartilhado, dentro dos
   US$ 5 autorizados. Não criar enquanto a retirada integral estiver incompleta.

Essas pendências são técnicas, não pedido de autorização repetida ao usuário.

## Reprodução e evidência

Os testes foram escritos antes dos módulos correspondentes; cada suíte primeiro
falhou por módulo inexistente e depois passou. Correções internas dos testes
preservaram o requisito de diretório canônico no macOS e a leitura conservadora
da disputa de journal, sem relaxar a proteção para obter aprovação.

```bash
node --test .local/worker-isolation/mount-transport.XgBcjD/reader.test.mjs .local/worker-isolation/mount-transport.XgBcjD/retirement.test.mjs .local/worker-isolation/mount-transport.XgBcjD/retirement-http.test.mjs
```

Fixtures são sintéticas e não autorizam uso dos nomes/IDs em Google Cloud.
Incluem fluxo completo do lifecycle com adapter HTTP e API falsa, auto-delete
do boot, reentrega, concorrência e ausência de segundo DELETE. Testes removem
somente seus próprios diretórios temporários privados; não acessam caches ou
arquivos de performance.

| Fonte privada         | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `scope.mjs`           | `ec397bf1f0d843d638646f32446cc7f326a6dc2b10a2443b04786c30fc8690be` |
| `reader.mjs`          | `057cdaf68e46d1e0fabc321263f15cbe88d2ad9ba863ec2d1307e12d2049e5ab` |
| `retirement.mjs`      | `7f7df6cd1ad5941fa5a57cadba462a33111784e7cbe5a1d71dac8258153d79be` |
| `retirement-http.mjs` | `d4d52569e63c237ee8845d418d698529de501883acf77a8de1f3d9adbb7d07d4` |

O fechamento atual será registrado em `verification.json` no diretório privado,
com suíte conjunta, links, formatação direcionada, diff-check, fotografia técnica
do gateway e integridade do ledger/evidências anteriores. Não confundir essa
suíte com execução operacional da VM. Maven/web/mobile/SDD anteriores não são
redatados sem mudança de runtime, schema, contratos, status ou defaults.

## Fechamento observado

Suíte conjunta: **309 testes aprovados**, zero falhas/cancelamentos/skips;
57 novos casos nesta parcela, todos locais. Conferidos 131 links relativos,
sintaxe JavaScript, scan limitado do recibo, Prettier direcionado e diff-check
dos documentos afetados. Permanece somente o finding global alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44` (linha vazia no EOF),
sem correção automática.

Os mesmos 419 paths/bytes do gateway mantêm o SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Ledger com duas reservas e recibos anteriores íntegros. Esse checksum não cobre
Dockerfile, mobile, documentação ou este tooling privado e não aprova segurança.
Nenhuma cotação, fatura ou consulta autenticada foi realizada novamente.

`verification.json`:
`cc7d1ad87e2b10272bb664ed618ccf13e145688590eee048b6f62fc69c8aa697`.
Este fechamento foi acrescentado depois do recibo, com formatação/diff conferidos
separadamente; não altera nem sobrescreve a fotografia anterior.
