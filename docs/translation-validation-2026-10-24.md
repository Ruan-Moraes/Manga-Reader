# Recuperação dos gates e validação simples de tradução — 2026-10-24

## Escopo autorizado

Ruan autorizou recuperar os gates e executar uma página sintética na cloud,
com OCR/tradução simulados, renderer real e retirada dos recursos temporários.
Orçamento: US$ 100 para o piloto completo, no máximo US$ 5 nesta rodada.
Essa retomada delimitada substitui a pausa somente para estas atividades.
Não habilita gateway público, providers reais, uploads de usuários ou produção.

## Gates locais recuperados

- CNG: `mobile/ios/` e `mobile/android/` permanecem locais, sem exclusão dos
  arquivos, e são ignorados pelo Git, cobertura SDD, ESLint e Prettier.
- O teste de regressão consulta a política real do manifesto: ignora artefatos
  nativos e continua recusando código novo em `src/` sem classificação.
- A referência ao teste iOS inexistente foi removida do comando de specs;
  os comandos nativos Android/iOS alterados pelo proprietário foram preservados.
- Dependências web reconciliadas pelo lockfile existente, com scripts de
  instalação bloqueados, sem atualização de versões ou mudança no lockfile.
- O teste de integração da landing espera o heading acessível da seção final
  carregada por `React.lazy`, com prazos explícitos para importação assíncrona.
  As verificações de conteúdo, navegação e acessibilidade permanecem presentes.

As referências de working tree das reviews/drift foram renovadas após revisar
as mudanças de infraestrutura e executar os gates. Identificam a árvore atual;
não representam nova execução de evidências físicas nem alteram status,
verdicts, requisitos ou checkboxes. Checksum mobile:
`035672bb0b5a5b981ee537eae05ca7469e392cd35607efd17a16b35b53e0b237`.

| Verificação | Resultado nesta execução |
| --- | --- |
| Maven global offline, Java 25 e Docker | Sete módulos aprovados, zero falhas/erros |
| Gateway após a extensão do probe | 1.298 testes, zero falhas/erros, 104 skips previstos |
| Mobile `pnpm check` | Aprovado; 25 testes de governança, 116 suítes/892 testes Jest |
| Web `tsc -b` | Aprovado |
| Web FSD com polling | Aprovado |
| Landing Vitest, forks e dois workers | 28 suítes/97 testes aprovados |
| Landing `tsc -b` após o ajuste do teste | Aprovado |

Os skips nativos/opt-in do Maven não são execução do renderer ou validação cloud.

## Pacote de uma página

O probe existente ganhou a opção exclusiva de testes `cloud-smoke-pt-BR`:
uma página, uma região e o texto conhecido `Olá, ação e café.`. Exige `READY`,
três etapas bem-sucedidas, manifesto/hash válidos e ausência de overflow;
exporta WebP e manifesto somente nesse cenário. Reentrega do mesmo job não
constitui uma segunda página. Não há alteração em APIs, migrations ou runtime
de produção; o teste unitário adicional verifica o texto independente dos
vetores de stress existentes.

O pacote privado foi reconstruído com os builders versionados, libwebp 1.6.0
oficial e imagem Temurin x86_64 fixada por digest. A imagem passou na admissão
nativa, que explicitamente não equivale a operação. O disco ext4 contém somente
imagens verificadas, classes selecionadas do probe, suporte e PNG sintético
320 × 220. Não contém credenciais nem mídia do usuário.

A checagem local emulada recusou a preparação do renderer antes do processamento:
`Renderer preparation unavailable`, sem OOM. Os limites observados permaneceram
8 GiB, swap adicional zero, 64 PIDs e tmpfs de 512 MiB. Não foram relaxados para
forçar o resultado. Essa recusa não identifica, por si só, a causa no host nativo.

## Rodada cloud

Projeto/região e identidade conferidos em registros privados. Billing ativo,
quota N2 e global suficientes e COS fixado disponível na consulta. O inventário
inicial não encontrou VMs, discos, imagens próprias ou repositórios de containers;
rede e bucket preexistentes foram preservados.

A API de faturamento foi habilitada para consultar preços atuais. Os SKUs N2
Default retornaram US$ 0,05018 por CPU/h e US$ 0,006725 por GiB/h: US$ 0,20796/h
para o host. Reserva de planejamento: uma hora de compute mais US$ 2 auxiliares,
total US$ 2,20796. Não é fatura nem hard cap do provedor. A contabilização
conservadora histórica não foi estornada nem substituída pelo custo líquido
exibido no painel.

Uma preparação inicial foi retirada sem solicitar VM: o CLI recusou disco
de 2 GB, exigindo mínimo de 10 GB. Bucket e imagem temporários foram removidos;
disco inexistente respondeu como tal. O contexto seguinte corrige o disco para
10 GB, preserva o payload de 2 GB e não repete uma solicitação de VM anterior.

A primeira VM foi criada e teve o binding conferido: N2 2 CPUs/16 GiB, sem IP
público/service account, disco de entrada somente leitura e exclusão automática
em 600 s. Boot, verificação do disco e importação das imagens foram observados;
não houve execução do worker, `READY`, manifesto ou imagem final.

O bootstrap encontrou duas diferenças de empacotamento: o Docker do COS não
aceita `image inspect --platform`; e os IDs do store local não são os IDs dos
arquivos de configuração serializados por `docker save`. Um ajuste do primeiro ponto na
mesma VM preservou os hashes e a checagem explícita de host x86_64. A checagem
seguinte recusou a identidade divergente antes de iniciar banco/worker.
O supervisor encerrou a observação sem conclusão; VM, disco, imagem e bucket
temporários tiveram cleanup com retorno zero. Não houve retry de capacidade ou
mudança de zona.

Uma consulta posterior independente confirmou zero VMs, discos, imagens e
buckets pertencentes aos contextos desta rodada. A rede e o bucket preexistentes
continuaram preservados. Não se presume gasto faturado zero por ausência de
recursos ou por cobertura com créditos; o faturamento pode chegar com atraso.

O disco corrigido usa os IDs SHA-256 dos bytes de configuração efetivamente
contidos no archive exportado e a inspeção compatível com COS. As verificações
de integridade permanecem exigidas. Ruan autorizou explicitamente uma segunda
VM temporária, na mesma zona, para concluir a validação. O limite original de
US$ 5 não foi renovado. Billing, preços e ausência de recursos remanescentes
foram consultados novamente antes dessa execução; seus logs têm diretório
próprio e não sobrescrevem os recibos anteriores.

### Resultado real da segunda VM

O worker executou uma página sintética na arquitetura x86_64 nativa e gravou
`READY`, com três etapas bem-sucedidas, uma região em português e zero overflow.
Os arquivos foram efetivamente adquiridos da saída serial da VM, sem reconstruir
uma resposta simulada no computador. O processo encerrou com código zero e sem OOM.

| Evidência observada | Resultado |
| --- | --- |
| Imagem final | WebP, 320 × 220, 9.154 bytes |
| Texto conhecido | `Olá, ação e café.` — legível em duas linhas |
| Hash da imagem | `7513040237e614b8e82cb6aeb9cb0da52b6a513cc640488b67123bee2dd27c8f` |
| Hash do manifesto | `713454f3609374aef76ff1d75af6f4031817aabc3527aa23cead09bad345394f` |
| Tempo do probe completo | 17,78 s, incluindo bootstrap |
| Tempo do cenário da página | 4,20 s |
| Pico do cgroup | 514.342.912 bytes, aproximadamente 491 MiB |
| Limite do cgroup | 8 GiB; swap adicional zero; 64 PIDs |
| Processo e exposição | UID 1000; zero listeners HTTP |
| Limites de espaço virtual | Pai e filha com 3 GiB; helper encerrado antes do processamento |

A conferência local verificou hashes contra métricas e manifesto, formato/dimensões
reais do WebP, texto completo, vínculo ao hash do PNG original e ausência de overflow.
O original reutilizável também foi conferido pelo probe. A inspeção visual simples
do artefato adquirido confirmou a legibilidade; não é revisão linguística independente.
Não houve chamadas a providers reais. VM, disco, imagem e bucket temporários
foram retirados com retorno zero. Uma nova consulta independente confirmou zero
recursos de todos os contextos desta rodada; a rede e o bucket preexistentes
foram preservados. A validação simples autorizada está concluída.

Recibo final privado de integridade, inspeção visual e retirada, SHA-256:
`03ea4c87bc2831151aa0a90831ac0299e5a989689da580b52ac1323be453bd8e`.

Fontes, pacotes, autenticação, journals, identificadores e logs ficam somente em
`.local/worker-isolation/recovery-2026-10-24/`, ignorado pelo Git. Preservar essa
pasta para reprodução e recuperação; os pacotes privados históricos perdidos
não foram apresentados como recuperados.

## Limites de conclusão

MOB-FEAT-020 permanece `in-progress/open`; MOB-FEAT-021, `approved/blocked`.
Esta rodada não valida qualidade linguística, todos os idiomas/formatos,
matriz de falhas, operação continuada ou aquisição do resultado no aplicativo.
PostgreSQL e armazenamento do pipeline foram temporários e locais à VM; a prova
não substitui a validação das integrações de produção com Cloud SQL, GCS e Cloud Tasks.

Referências públicas: [instalação do CLI](https://docs.cloud.google.com/sdk/docs/install-sdk),
[API de preços](https://docs.cloud.google.com/billing/docs/how-to/get-pricing-information-api)
e [prazo máximo de VM](https://docs.cloud.google.com/compute/docs/instances/limit-vm-runtime).

## Continuidade dos gates — 2026-10-25

A rodada mobile posterior implementou a revisão aprovada da 021. Ver
[evidência nativa](../mobile/docs/specs/features/MOB-FEAT-021-local-translation-result-reader/evidence/native-acquisition-2026-10-25.md).
Checksum corrente é o cabeçalho das reviews; o valor de 24/10 acima permanece
como registro histórico. O cálculo passou a ignorar somente `.DS_Store`, já
ignorado na cobertura/Git, após regressão demonstrar que Finder invalidava as
referências sem mudança de implementação. Teste confirma que código alterado
continua invalidando checksum; recursos/configurações seguem cobertos. Nenhum
arquivo local foi removido para estabilizar o gate.
