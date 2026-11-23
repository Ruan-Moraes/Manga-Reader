# Toonlira — APK Android e gateway de tradução

Data: 2026-11-03. Documento para desenvolvimento; não é evidência de deploy
ou de funcionamento do processamento remoto.

## Endereços e responsabilidades

| Endereço | Projeto e finalidade |
| --- | --- |
| `https://toonlira-rm.web.app` | Firebase Hosting existente do aplicativo web Toonlira. |
| `https://toonlira-rm-landing.web.app` | Firebase Hosting existente da landing page Toonlira. |
| `https://translation-api.toonlira.app` | Origem de referência do Translation Gateway Toonlira no contrato OpenAPI 2.0; não é uma API pública do Google Translate. |

O APK de teste é compilado com `EXPO_PUBLIC_TRANSLATION_GATEWAY_URL` apontando
para a terceira origem. Ela deve expor o contrato do gateway, que autentica a
sessão, coordena Google Vision/Translation e renderiza a página. Em 2026-11-03
o domínio de referência não resolvia no DNS e não foi encontrado serviço
implantado no projeto GCP `toonlira-rm`; configurar essa variável não cria o
serviço. Antes do teste real, disponibilizar uma origem HTTPS efetiva e
recompilar o APK se ela diferir da origem incorporada.

O Firebase Hosting das páginas existentes não deve ser confundido com o
gateway. A [documentação oficial](https://firebase.google.com/docs/hosting/cloud-run)
estabelece timeout de 60 segundos para requisições encaminhadas pelo Hosting;
o processamento volátil atual inclui cenário de deadline nativo de 90 segundos.
Por isso, não assumir que um rewrite Firebase atende o contrato de transporte.
O gateway precisa de infraestrutura GCP admitida, HTTPS, configuração dos
providers e disclosures, e proteção de dados conforme
[arquitetura volátil](volatile-processing-architecture.md).

## Build Android de teste

O build release local usa a chave de debug já configurada em `mobile/android`;
é um APK para teste, não uma assinatura de publicação. O bundle JavaScript
incorpora a URL no momento da compilação. A instalação no aparelho ainda não
foi verificada e pode exigir desinstalar uma versão existente com assinatura
diferente; não remover dados existentes sem a decisão do usuário.

O APK gerado nesta sessão é `mobile/android/app/build/outputs/apk/release/app-release.apk`,
pacote `com.toonlira.app`, versão `1.0.0`, Android 7.0 ou superior. A assinatura
foi conferida, e a origem `https://translation-api.toonlira.app` foi encontrada
no bundle incluído. SHA-256 do APK:
`102248ad68c0e77f0b7c9de737aa0f0ba14bf8e7c3046fed45fbc3c162c52c39`.
O build usou Java 21 e o Babel instalado no workspace. O domínio ainda não
resolve; o APK não permite testar tradução remota até existir o gateway HTTPS.

## Preparação adicional para o teste público

Em 2026-11-03 foi confirmada a cobrança ativa do projeto `toonlira-rm` e,
no console de cobrança, R$ 1.758 de crédito de avaliação restante. O console
mostrava o término da avaliação em 2026-12-07; a retirada do ambiente deve
ocorrer até 2026-12-06, sem depender da avaliação cobrir todos os custos.
Valores de cobrança podem chegar com atraso.

Foram habilitadas as APIs Cloud Translation e Cloud Billing Budget e criado
o orçamento de alertas `toonlira-translation-test-20261103`, de R$ 1.000,
limitado ao projeto e ao período de 2026-11-03 a 2026-12-06, com alertas
em 50%, 75% e 90%. **O orçamento não desliga recursos e não constitui um
teto de gastos.** O limite autorizado de US$ 270 para a janela continua
valendo; a cifra em reais é uma margem operacional, não uma conversão
garantida. Nenhum novo gateway público ou VM permanente foi criado até esta
atualização.

O código local acrescenta uma proteção opcional de tentativas para o ambiente
de teste, descrita em
[planejamento do limite](../api/apps/translation-gateway/docs/private-test-budget-design-2026-11-03.md).
Ela introduz a migration V11 para um contador operacional agregado, apesar da
premissa original de que nenhuma migration seria necessária. Ela não guarda
conteúdo nem altera o contrato público; está desligada por padrão e ainda não
foi implantada. Um limite de tentativas também não garante limite financeiro
para respostas cobradas pelos providers.

Há configuração e testes locais de um proxy e das páginas legais em três
idiomas em `api/apps/translation-gateway/infra/private-test`. Eles não são
prova de HTTPS público, publicação legal ou funcionamento no GCP. Antes de
aceitar mídia real ainda faltam, entre outros gates: comprovar interrupção e
retirada automáticas dos recursos próprios, validar custos e identidade de
menor privilégio, verificar a candidata modificada em AMD64 e publicar e
conferir o disclosure. Os sites Firebase existentes não foram alterados.

Verificações locais desta preparação: `./mvnw test` no reactor passou com
1.456 testes, zero falhas e 116 skips; `pnpm check` no mobile passou com
128 suítes e 1.016 testes; o build web e os dois testes do gerador legal
passaram. O teste sintético do proxy cobriu limites de entrada e resposta,
desconexão e ausência de retry; não substitui verificação na VM. O Device Hub
continuou indisponível por `-10005: timeoutReached` na consulta via CUA.
O JAR candidato produzido após a migration tem SHA-256
`7e3bd84a2c8263959d5d022f6401d4ba2807d684cc72da98e4c4a23b1dffaeb3`.
A prova AMD64 da candidata 6 anterior não valida esse novo JAR.

O receptor de orçamento em `infra/private-test/budget-*.mjs` está preparado
e testado apenas localmente: valida conta, orçamento e moeda, identifica a VM
pelo ID e rótulo e solicita sua parada. O receptor devolve erro até observar
a VM parada, para permitir nova entrega Pub/Sub. Sua autenticação depende de
IAM do Cloud Run, ainda não configurado; os testes usam respostas simuladas.
Ele não apaga disco, IP ou registry, e não substitui a retirada agendada nem
garante um teto de gastos. O Google informa que notificações podem atrasar,
repetir ou chegar fora de ordem. Nenhum receptor foi implantado ou ligado ao
orçamento nesta etapa.

Atualização posterior: o Cloud Run privado `tl-translation-budget-1103`, as
identidades sem chave `tl-test-budget-ctl` e `tl-test-budget-push`, o tópico
`tl-translation-budget-1103` e a assinatura autenticada
`tl-translation-budget-push-1103` foram criados. O orçamento foi ligado ao
tópico, preservando seus alertas. **A proteção ainda não está operacional**:
o serviço contém ID de VM provisório `1` e a parada real ainda precisa ser
comprovada. A mensagem sintética de custo zero foi recebida com HTTP 204.
O papel `toonliraBudgetStop1103` agora permite consultar e parar apenas a VM
nomeada `tl-translate-test-1103`, por condição IAM; seu ID definitivo deverá
ser configurado após a criação. Esses recursos também devem ser retirados ao
final da janela.

Foram habilitadas as APIs Cloud Scheduler e Workflows e criadas as identidades
sem chave `tl-test-expiry` e `tl-test-scheduler`. O workflow
`tl-translation-expiry-1103` verifica identidade da VM e do registry e bloqueia
exclusão antes de 2026-12-06 às 12h em São Paulo. A leitura de teste passou e
a tentativa antecipada foi recusada. O job de mesmo nome está agendado entre
12h e 23h desse dia; uma invocação de teste pelo Scheduler alcançou o workflow
e foi recusada pela barreira de data, como esperado. O workflow ainda usa ID provisório para a VM e não remove IP,
identidades, job ou demais recursos de controle; a retirada completa e a
parada real ainda não estão comprovadas.

Foi criada no Codex a automação diária `monitorar-teste-de-tradu-o-toonlira`
para verificar custos, prazo e recursos do teste, mantendo silêncio quando não
houver mudança relevante. Ela é uma verificação suplementar dependente do
ambiente local; não substitui o desligamento no GCP nem assegura teto de
gastos ou execução se esse ambiente não estiver disponível.

A identidade sem chave `tl-test-gateway` recebeu apenas
`serviceusage.services.use` e `cloudtranslate.generalModels.predict` no
projeto e leitura do registry dedicado; as chamadas aos providers ainda não
foram ativadas. A revisão automática rejeitou uma proposta de permissão de
exclusão de IP por abranger todos os endereços do projeto durante a janela,
além do recurso próprio. Nenhuma permissão de IP foi criada por essa tentativa;
a retirada do IP reservado permanece sem solução autorizada e comprovada.

A imagem AMD64 local do receptor foi montada com base Node fixada por digest
e executada como usuário sem privilégios, em filesystem somente leitura e sem
rede externa, num smoke sintético. Isso não demonstra entrega Pub/Sub, IAM ou
parada real; a prova de execução no Cloud continua pendente.

A partir da preparação posterior, existe o registry dedicado
`southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103`,
identificado com o rótulo `toonlira-test=translation`. As quatro imagens do
controlador, gateway, proxy e PostgreSQL foram publicadas por digest; o recibo
local está em `.local/toonlira-public-test-20261103/published.json`. Esse
registry precisa ser incluído na retirada e pode gerar custo de armazenamento.
Ele não configura VM, gateway público ou controle de desligamento por si só.

Atualização posterior: o proxy local foi alterado e uma nova camada privada
de limite de requisições foi preparada. Ambas as imagens atualizadas foram
publicadas por digest e verificadas no registry; o recibo é
`.local/toonlira-public-test-20261103/published-v2.json` e o recibo anterior
foi preservado. O limite usa
janela em memória de 30 requisições por cliente e 180 globais por minuto;
reiniciar o processo zera essa janela e ela não substitui o contador durável
de tentativas pagas nem proteção volumétrica. Em rede interna sintética, o
31º pedido recebeu 429 mesmo com cabeçalho de cliente falsificado. Testes
loopback cobriram resposta de 64 MiB, cancelamento e ausência de retry.
Faltam verificação no alvo AMD64 e validação integrada antes da exposição
pública. Em uma nova execução isolada com essa camada, instalação e sessão
sintéticas também retornaram HTTP 201; os recursos Docker foram removidos.

Os quatro digests foram novamente conferidos no registry contra o recibo
local. O preflight `deployment-preflight.mjs` confere os digests do gateway,
proxy, limitador e PostgreSQL contra o recibo atualizado, além de projeto, hostname/IP, janela,
segredos e pares de idiomas. Foi exercitado sem rede em contêiner AMD64
emulado, com dados sintéticos e caso negativo de IP divergente. Ele ainda não
está integrado ao bootstrap de uma VM e não comprova a resolução DNS nem o
certificado HTTPS.

O iniciador `Dockerfile.launcher` combina cliente Docker 27.5.1 e Compose
2.40.3 oficiais fixados por digest. Ele foi publicado no registry dedicado;
o recibo está em `.local/toonlira-public-test-20261103/launcher-receipt.json`.
Em teste local isolado, criou a composição sintética, verificou criação de
instalação e sessão (HTTP 201) e removeu os recursos. A imagem AMD64 foi
emulada no host ARM; a inicialização no COS, a proteção de metadata do proxy
e a recuperação após reinício ainda precisam ser validadas na VM.

Na prova privada `mob020-meta-79d83fa2`, em COS125/AMD64 sem IP público, as
redes do gateway e do proxy foram separadas e o filtro de metadata foi
instalado antes dos contêineres. O processo na rede do gateway acessou os
dois endereços de metadata previstos; o processo na rede do proxy não os
alcançou. A prova terminou com código zero e os arquivos operacionais estão
em `.local/toonlira-public-test-20261103/amd64-metadata/evidence/volatile/`.
VM, disco, redes e identidade temporários foram removidos, sem bindings
temporários no IAM ou no registry. A prova usa contêineres sintéticos e não
verifica a composição completa, reinício do daemon ou exposição pública.

Uma segunda rodada, `mob020-meta-9d34c18a`, tentou verificar reinício do
Docker. A coleta contém apenas os resultados anteriores ao reinício e não
contém os recibos esperados depois dele. O código zero emitido pelo harness
não é válido para essa prova: a rotina de limpeza sobrescrevia a variável de
status. O resultado após reinício permanece não comprovado. VM, disco, redes,
identidade e bindings temporários da rodada foram removidos e sua ausência foi
conferida no inventário.

A correção do harness foi verificada localmente com uma falha forçada, que
produziu código 1. A nova rodada `mob020-meta-3be6142f` não chegou a criar VM:
o comando de criação da rede excedeu seu prazo, apesar da operação de criação
constar como concluída. A rede identificada foi removida e o inventário final
confirmou ausência dos recursos próprios. Não houve repetição da criação
ambígua; o teste de reinício segue pendente.

Na rodada `mob020-meta-a11e7c60`, a proteção inicial passou, mas após
`systemctl restart docker` ambos os contêineres sintéticos continuaram em
execução mesmo com política de reinício `no`. A hipótese de que estariam
parados foi rejeitada e a prova terminou com código 1. VM, disco, redes,
identidade e bindings temporários foram removidos e sua ausência confirmada.
O bootstrap agora recusa iniciar quando Docker informa `LiveRestoreEnabled`
ativo; esse controle foi testado com comandos simulados. A configuração real
do daemon e a proteção durante e após um reinício ainda precisam ser
verificadas antes de qualquer exposição pública.

Em `mob020-docker-dfe38419`, a consulta da configuração do Docker não
chegou à VM: o token usado pelo coletor expirou depois de uma espera longa e
a primeira limpeza ficou incompleta. O binding foi conferido como ausente;
a sub-rede e a rede foram removidas acompanhando suas operações existentes.
O inventário posterior mostrou zero VM, disco, rede, sub-rede ou identidade
da rodada e nenhum binding temporário no registry. Antes de nova execução,
o coletor deve renovar o token para leituras demoradas, sem repetir mutações
cuja resposta seja ambígua.

Na rodada posterior `mob020-meta-665e2bf9`, o COS relatou
`LiveRestoreEnabled=true` antes e depois do reinício; ambos os contêineres
continuaram ativos. Após o reinício, a regra ainda ocupava a primeira posição
em `DOCKER-USER`, seus dois bloqueios estavam presentes, o gateway alcançou a
metadata e o proxy não a alcançou. O teste terminou com código zero e a
limpeza e o inventário finais confirmaram ausência dos recursos e bindings da
rodada. Essa observação antes e depois não prova ausência de uma janela de
exposição durante o reinício; o bootstrap continua recusando live restore até
que o comportamento durante a transição seja resolvido.

A composição preliminar em `infra/private-test/compose.yaml` separa PostgreSQL,
gateway, limitador e proxy e configura os limites Docker do worker. A sintaxe foi validada
com valores sintéticos; o teste sintético existente do proxy passou após a
configuração de upstream parametrizável. A composição ainda precisa de prova
integrada em AMD64, credenciais e imagens verificadas, bloqueio de acesso à
metadata para o proxy, inicialização após restart e retirada automatizada.
Não foi aplicada a uma VM e não autoriza tráfego real.

O comando `docker run --ulimit as` recusou essa opção no teste local. Uma
verificação posterior mostrou, porém, que o Compose a aplica: o processo de
teste relatou limite soft e hard de 3 GiB em `/proc/self/limits`. A opção foi
restaurada na composição. O gateway também verifica o limite, que continua
exigindo comprovação na composição final na VM.

O bootstrap `start-private-test.sh` foi preparado para conferir o host COS e
os digests, instalar a barreira de metadata, manter o proxy em quarentena e
liberá-lo somente após as verificações de rede. Testes com comandos simulados
verificaram que falha de preflight não inicia serviços e falha da checagem de
metadata mantém a quarentena. O script ainda não foi executado na VM; falta
validar a composição completa, sua instalação no boot e recuperação após
reinício. O firewall externo deve permanecer fechado até essa validação.

Na verificação local posterior, PostgreSQL e gateway iniciaram com a V11,
credencial sintética sem validade e apenas uma rede Docker interna. A execução
foi em imagem AMD64 emulada em host ARM, sem chamadas reais aos providers; os
contêineres, rede e volume do teste foram removidos. Uma tentativa anterior
com credencial sintética e rede de saída ativa foi rejeitada pela revisão
automática antes da execução; o teste seguinte usou rede interna sem saída.
Essa inicialização não valida o pipeline de tradução, IAM ou o alvo AMD64.

Uma verificação local posterior adicionou o proxy à mesma rede interna sem
saída: `GET /v2/capabilities` pelo proxy retornou 200 com transporte
`volatile-direct-response` e um par sintético habilitado; a página de
privacidade retornou 200. Contêineres, rede e volumes temporários foram
removidos. Não houve chamada aos providers, teste TLS público ou execução
nativa AMD64; a imagem AMD64 rodou em emulação no host ARM.
Na mesma composição isolada, a criação de instalação e a troca da credencial
por sessão retornaram HTTP 201 pelo proxy. As credenciais sintéticas não foram
impressas; os recursos Docker desse segundo teste também foram removidos.

Foi iniciada uma rodada privada AMD64 da candidata modificada, com VM COS125
sem IP público, identidade de leitura do registry e providers simulados. A
coleta falhou imediatamente por usar um caminho REST incorreto para a porta
serial; não houve evidência suficiente para aprovar a candidata. A VM, disco,
rede, sub-rede e identidade foram removidos e sua ausência foi confirmada;
a concessão temporária de leitura do registry também foi retirada. O caminho
foi corrigido para `/serialPort` e verificado localmente; uma nova rodada
precisa de evidência própria e não deve substituir este registro de falha.
Na segunda preparação, a identidade recém-criada ainda não havia propagado
ao IAM e a concessão no registry falhou antes da criação de VM. A remoção foi
confirmada posteriormente para identidade, rede e sub-rede, sem concessão
temporária remanescente. A próxima tentativa deve aguardar a propagação da
identidade antes de conceder a leitura.

A terceira rodada privada, identificada como `mob020-c7-7f08d3ae`, terminou
com código zero na matriz sintética AMD64 e teve VM, disco, rede, sub-rede e
identidade removidos; não há concessão temporária restante. A
[evidência da candidata 7](../api/apps/translation-gateway/docs/volatile-candidate-7-amd64-2026-11-03.md)
registra medições e limitações. Ela não cobre providers reais, cancelamento
explícito no alvo nem a composição pública com limitador, e não conclui a 020.

As features 020/021 continuam abertas até prova nativa/offline, cancelamento
no alvo admitido e acessibilidade física. As páginas e os providers de produção
não foram alterados por esta preparação.
