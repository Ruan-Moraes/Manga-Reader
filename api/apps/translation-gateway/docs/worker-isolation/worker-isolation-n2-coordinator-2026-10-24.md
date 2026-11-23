# Leitores e coordenador N2 — 24/10/2026

Continuação da [preparação do perfil N2](worker-isolation-n2-preparation-2026-10-24.md).
A 020 permanece `in-progress/open` e a 021 `approved/blocked`. Este incremento
prepara a composição N2 e sua observação de metadados; não é admissão do worker
completo, criação de VM, deploy ou autorização derivada para produção.

## Leitores e quota próprios

Pacote privado `.local/worker-isolation/mount-n2-read.XFmA5j/`:

- Cinco GETs fixos conferem identidade do projeto Resource Manager, projeto
  Compute, COS fixado, `n2-highmem-2` e zona B. Hashes de identificação do projeto
  são distintos para as duas APIs; nenhum é inferido do outro.
- Máquina exige 2 vCPUs, 16.384 MiB, x86_64 quando informado, CPU não compartilhada
  e Cascade Lake disponível. A ausência de arquitetura não inventa confirmação.
  Metadata herdada precisa estar vazia; seus valores não são guardados.
- Dois GETs de quota conservam somente métricas conhecidas. O validador exige
  headroom de dois cores em `N2_CPUS` e `CPUS_ALL_REGIONS`, além dos recursos do
  ensaio. Quota N1 ou preemptible não substitui N2 ausente/insuficiente.
- Captura limitada a 30 s, corpos de 32 KiB para metadados e 256 KiB para quota,
  sem retry/redirect. Frescor de quota menor que 60 s; capacidade física não é
  garantida nem reservada por consultar quota.
- Identidades têm propósitos N2 explícitos, mesmo SDK/account existentes e
  controles TLS/proxy/overrides preservados. Somente o GET Resource Manager
  recebe o quota project fixo derivado internamente.

Os **123 testes offline** passaram entre **11:04:59.953 e 11:05:00.588 UTC**,
com 559 entradas de fontes/evidências conferidas e ledger intacto. Testam
respostas sintéticas, cancelamento, tamanho, campos inválidos, limites, TTL,
acessores, contas/SDK e rejeição de N1. Nenhuma credencial real foi usada nessa
execução. Recibo:
`930a0b6fa6420d6174875c8075cb6fc4dc0515377501f5b3d3d47e8cbe2ed6ed`.

## Integração do coordenador

Pacote privado `.local/worker-isolation/mount-n2-coordinator.U7oGll/`.
Engine, guard e admissão agora selecionam:

- Perfil/request/binding N2 do grafo já verificado, preservando Standard,
  prazo, restrições de rede, discos, credenciais e cleanup.
- Parser/cenário de custo próprios para duas CPUs e 16 GiB do host. Cotação N1
  não é aceita; o teto de 500 centavos da rodada e a cobertura até cleanup
  permanecem exigidos.
- Fonte/identidade/SDK vinculados ao recibo dos leitores N2, com quota validada
  após a leitura e novamente antes da reserva e na admissão.
- Guard dos dez registros anteriores e suas 108 URLs, sem redatar as capturas
  originais ou aceitar ausência histórica como consulta atual.
- Validação de metadados compartilhada entre guard e admissão, evitando duas
  regras diferentes para máquina/identidade. Os contratos e defaults do produto
  não são alterados por essas ferramentas privadas.

As fixtures do ensaio integral usam journals CAS Java reais, transporte nativo
do candidato e arquivo adquirido anteriormente, com HTTP/identidade/financeiro
sintéticos. Sete módulos de fixtures têm imports remapeados para o grafo N2;
datas, plataformas e estados simulados não são capturas reais.

Cada cenário copia integralmente as onze reservas para diretório privado
temporário e usa `reserve` real para acrescentar a reserva 12 **somente no clone**.
Os hashes das onze reservas copiadas e do ledger original são preservados. Não
houve substituição de reserva, estorno ou aumento do orçamento real nos testes.

A primeira execução integral passou em onze cenários: sucesso, capacidade,
HTTP400, upload ambíguo, controle autoritativo de reserva, cancelamento antes do
wire, confirmação VM perdida, negação nativa, transporte, ausência final inválida
e CRM429. A execução final com hashes fixados tem recibo próprio; resultados
posteriores são registrados abaixo, sem reclassificar simulação como cloud.

### Gate final offline

Entre **11:17:01.519 e 11:20:49.671 UTC**, a execução final passou em **61 testes**:
26 de guard/pré-reserva, 17 de vinculação da quota, sete da seleção nativa/leitura
do recibo e os onze cenários integrais reexecutados. Zero falhas, skips ou
cancelamentos; 585 entradas de fontes/evidências conferidas antes/depois, rede e
SDK real bloqueados nos testes, ledger original byte a byte intacto.

Recibo `verification.json`:
`c8939132c271d8f16408ef54ce019046ad22a4ca4ad471c74b70074c8886e33a`.
Os onze cenários da primeira execução não são somados novamente aos 61 finais.
Os journals, retenção de capacidade, recuperação e retirada exercitados nessa
matriz são código real com transporte simulado; não foram inventados boot ou
artefatos do worker em cloud.

### Observação nativa posterior, somente leitura

Após conferir o recibo final, o observador executou uma única captura entre
**11:21:44.877 e 11:21:50.314 UTC**. Sete GETs retornaram 200; os novos validadores
aceitaram os metadados e a quota. Fontes/SDK e ledger foram conferidos antes/depois,
sem mutação de cloud ou reserva financeira. Resultado sanitizado:
`b5571c1f320b490d345392a040191718978e2017dcc402951957504b0cfec9bf`.

- Projeto ativo, identificadores corretos para ambas as APIs e metadata herdada
  vazia, sem startup herdado observado.
- COS `cos-125-19216-760-8` `READY`, x86_64 e sem depreciação naquele instante.
- `n2-highmem-2` com dois cores e 16.384 MiB, `isSharedCpu=false` explícito.
  A API não informou arquitetura do machine type; o registro conserva
  `not-reported`, sem converter essa ausência em confirmação.
- Zona B `UP`, plataforma mínima disponível; `N2_CPUS` com limite 200/uso zero
  e `CPUS_ALL_REGIONS` com limite 32/uso zero. Demais quotas do ensaio suficientes.

Headroom não reserva quota nem prova disponibilidade física. Essa captura não
é admissão de criação: já terá expirado para um futuro operador, que precisa
consultar novamente. O projeto contém a rede/firewalls preexistentes; não foi
declarado vazio nem foram removidos recursos desconhecidos. Nenhuma imagem,
chamada OCR/tradução, instalação ou chave nova foi envolvida.

## Limites e sequência

Os leitores nativos concretos não recebem SDK, conta, endpoint ou fetch do
chamador. Conferem o recibo e todos os fontes antes/depois, aguardam credenciais
iniciadas e publicam somente observações tipadas, sem token ou erro bruto.
O observador é separado, sem argumentos, com diretório de captura exclusivo;
não retoma automaticamente uma observação parcial.

A observação real acima não substitui preflight fresco de um futuro operador.
Não cria VM, IAM, API, bucket ou reserva e não envia imagem. A integração de uma entrada de
execução única, captura financeira N2 real e seleção do próximo operador continuam
necessárias antes de nova criação.

Host de 16 GiB não admite aumentar automaticamente o worker: teto experimental
separado de 8 GiB, contenção, boot/montagem, orçamento agregado, matriz de falhas,
integração privada, retenção e qualidade visual continuam pendentes em cloud.

Ledger real permanece com onze reservas, USD 55 reservados e USD 70 contabilizados
com folgas, de USD 100 autorizados; margem normal USD 30, sem fatura verificada.
Os fontes técnicos do gateway continuam 419, checksum
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Preservar recibos e arquivos de performance. Nenhuma alteração em APIs,
migrations, mobile, defaults, tradução real, instalação ou deploy.

A fotografia dos gates globais de 10:51–10:53 UTC permanece no
[registro anterior](worker-isolation-n2-preparation-2026-10-24.md): Maven offline
com Docker, web e mobile completos aprovados. Fontes Java atuais foram novamente
conferidos pelo mesmo checksum; esses resultados históricos não são apresentados
como nova execução Maven por este gate exclusivamente Node/CAS.
