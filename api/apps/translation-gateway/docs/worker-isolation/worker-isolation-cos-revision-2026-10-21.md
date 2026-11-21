# Revisão explícita COS73916 — 2026-10-21

Continuação do [preflight recusado pela depreciação](worker-isolation-n1-preflight-2026-10-20.md).
Foi preparada uma revisão privada de contratos e preflight para a substituta
indicada pelo Google. **Nenhuma VM, imagem cloud ou recurso novo foi criado**;
não houve instalação, upload, chamada de provider ou reserva adicional.
A 020 continua `in-progress/open`; a 021 permanece bloqueada.

## Pin e contratos locais

O candidato `mount-n1-cos73916.uI1Equ` centraliza em `image-pin.mjs`:

- imagem concreta `cos-125-19216-739-16`;
- ID `3497199878532703206`;
- binding próprio `mount-binding-n1-cos73916-1`;
- referência ao recibo de metadados de **2026-10-20**, sem redatar a observação;
- `operationalApproved=false`.

Não há resolução de família/latest, substituição automática ou alias para a
imagem anterior. Requests, binding, scope e emissão do binding foram ajustados
juntos. O hardware N1 continua igual; revisão de imagem não significa novo
perfil de capacidade ou aprovação do worker completo.

Foram copiados 38 módulos/testes/fixtures com proveniência. Quatro módulos
existentes de lógica receberam alterações semânticas; os outros **18 módulos
de lógica** copiados foram conferidos byte a byte. O novo módulo do pin é
imutável. O grafo de produção tem 43 módulos e recusa backlinks para os
contratos anteriores de perfil/imagem.

O RED preservado tem duas falhas específicas. O gate completo passou em
**140 testes**, sem falhas/skips/cancelamentos: os 136 anteriores e quatro
novos casos de pin, binding, imutabilidade e journals. HTTP/identidade são
sintéticos, com bloqueador de HTTP/CLI reais; CAS Java e archive são locais
reais. Não é prova de boot ou isolamento na cloud.

O journal permanece CAS5, mas o bundle/hash muda. A mesma máquina/formato CAS
não autoriza adotar o contexto de outra imagem. Os testes conferem rejeição
nos dois sentidos, preservando os bytes. Nenhum journal/recibo anterior foi
migrado, apagado ou sobrescrito; nenhum banco ou migration do produto mudou.

## Preflight: cinco GETs reais

`mount-n1-cos-preflight.E3SXeH` tem formato próprio
`mount-n1-cos73916-native-read-only-admission-1`, pin central importado do
contrato e purpose explícito para a identidade existente. Mantém cinco GETs
fixos/ordenados, prazo total de 30 segundos, 32 KiB por resposta, UTF-8 estrito,
sem retry/redirect e sem persistir valores/chaves de metadata. O leitor puro
nunca atesta identidade nativa. A arquitetura omitida pelo tipo de máquina
continua `not-reported`.

O RED tem 65 testes aprovados e duas regressões novas falhando. Após implementar
a revisão, **67 testes passaram**, com rede/CLI reais bloqueadas. A imagem
anterior é recusada mesmo que ainda responda READY e omita depreciação.

Entre **10:12:23.312 e 10:12:26.914 UTC de 2026-10-21**, o wrapper fez somente
os cinco GETs reais, todos HTTP200/correspondentes:

| Leitura          | Validação observada                                    |
| ---------------- | ------------------------------------------------------ |
| Resource Manager | Projeto ativo e número pinado                          |
| Compute project  | ID pinado distinto do número, metadata vazia           |
| COS73916         | Nome/ID, READY, X86_64, 10 GiB, sem depreciação        |
| Tipo N1          | `custom-1-1024`, 1024 MiB, um vCPU não compartilhado   |
| Zona             | `southamerica-east1-a`, UP, Intel Broadwell disponível |

SDK e fontes permaneceram inalterados. Nenhuma credencial, resposta bruta,
mídia ou texto foi registrado. Essa observação não prova disponibilidade
física, segurança dos binários ou execução do worker. Sua validade curta já
exige renovação antes de admitir qualquer criação.

## Admissão e integração

O candidato `mount-n1-cos-admission.y8ogL1` vincula os contratos da nova imagem,
o formato/nome do novo preflight e o GET nativo exclusivo da substituta.
Permanece independente da autoridade de cleanup. Preserva revogação, limites,
leases, proibição de segunda criação, HTTP400/403 e confirmação perdida.

Preços e quotas históricas só são redatados em **fixtures sintéticas**
explicitamente identificadas, nunca como evidência real. A cotação anterior
expirou; billing/quota/preflight e ausência dos escopos anteriores devem ser
renovados para a janela completa. Não há novo operador nativo admitido.

O RED preservado falha nos três casos novos: aceitação da substituta, recusa
do preflight anterior e caminho GET nativo. A suíte integral contém 105 testes.
A primeira execução passou nos 105 testes, mas o verificador terminou com
exit 1: uma asserção herdada ainda esperava 102 aprovações. O recibo, TAP e
verificador dessa tentativa permanecem preservados. A revisão V2 corrige
somente a contagem esperada para os três testes adicionados e reexecuta o
conjunto; não muda a lógica de admissão ou enfraquece critérios funcionais.
A V2 terminou com **105 testes aprovados**, sem falhas/skips/cancelamentos,
fontes inalterados e exit 0 do verificador. São 102 casos herdados e três novos;
há regressões comuns entre suítes, não 105 cenários inéditos independentes.
O exit 1 anterior não foi considerado um gate verde, mesmo que seu recibo
interno registrasse o exit 0 dos testes filhos.

## Recibos sanitizados

| Evidência privada             | SHA-256                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| Contrato completo, 140 testes | `ed0cee3e277f50a3676dc4ec8e8acadb44c70b3960d3af76102bb720c3136fa2` |
| Preflight, 67 testes          | `4b58777d986c727cc2cc9dd1fec1c32a59bd4c61f4bbf597e38f84266125a90f` |
| RED do preflight              | `72376acb9a592a716e30334d03bdecfcc34eee76469060548c784a74e0ab7321` |
| Cinco GETs reais              | `0a05018058bf22ef2ad9f9086464331f6e99bff2098858c866c72585e9dc28b8` |

Integração V2: `ce292bf09ae7306ec301c93506a3035e418ea61b34b4ff1014f4fb6fced0d522`.
Recibo preservado da tentativa com verificador incorreto:
`9b2ff457d2f2896ead3e494d2924ed8946b30187c7e49fc90fdf2475aaac8639`.

## Gates do repositório reexecutados

- Maven global offline com toolchains locais e Docker: todos os módulos
  `SUCCESS`, zero falhas/erros. O gateway registrou 1297 testes e 104 skips,
  sem apresentar esses skips como verificação real concluída.
- Type-check web `tsc -b`: exit 0.
- `pnpm specs:check`: exit 0, validações e links aprovados.
- `pnpm check` mobile completo: exit 0, incluindo 116 suítes/892 testes Jest.
  Há avisos de `act(...)` em testes existentes, sem alterações automáticas
  nos componentes ou arquivos da auditoria de performance.

O comando Maven foi `./mvnw -o -t <toolchains-local-já-existente> test`, com
Java 23 no reactor e toolchain Java 25 no gateway. Nenhuma dependência foi
reinstalada. Isso não atesta operação do worker na cloud ou qualidade linguística.
O diff global continua apontando a linha em branco já existente de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, fora do escopo.

O checksum técnico de 419 fontes do gateway continua uma fotografia separada
do tooling privado. O ledger permanece com quatro reservas de USD 5, nenhuma
nova; isso não representa gasto faturado nem hard cap do Google. A skill
`database-design` orientou a preservação da chave por bundle e a recusa de
migração/adopção de journals, sem mudanças nos bancos do produto.

## Próxima etapa para a prova restrita

A [continuação do operador](worker-isolation-n1-operator-2026-10-21.md) registra
a composição posterior e seus testes offline, sem apresentar preparação como
execução real ou reescrever os snapshots de contratos acima.

1. Compor operador próprio com os recibos verificados da admissão.
2. Renovar cotação/billing/quota/preflight/ausências para toda a janela.
3. Só depois vincular novo run ID/reserva ao escopo de prova curta e executar
   com cleanup independente. Sem reutilizar operador/lock/contexto anteriores.
4. Manter separados boot seguro, runtime/CVEs, memória do worker completo,
   renderização, qualidade e retenção. Uma prova mount-only não conclui a 020.

Não houve alteração dos defaults, runtime do produto, migrations, termos,
mobile, arquivos de performance ou infraestrutura publicada.
