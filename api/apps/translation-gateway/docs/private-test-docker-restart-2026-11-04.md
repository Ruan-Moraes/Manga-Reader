# Ensaio privado de reinício do Docker — 2026-11-04

Evidência parcial para a preparação do ambiente de teste Android; não autoriza
exposição pública e não comprova o bootstrap definitivo, TLS, providers reais
ou reinício automático após reboot da VM.

A rodada `mob020-meta-4fe72b19` usou COS125 AMD64, Docker 27.5.1, VM
`e2-highmem-2`, sem IP público, identidade temporária com leitura do registry
dedicado e contêineres sintéticos. O arquivo padrão do daemon informava
`live-restore: true`. Na VM descartável, o ensaio preservou as demais opções,
configurou `live-restore: false` e reiniciou o daemon. Ambos os contêineres
estavam parados após o primeiro reinício. O ensaio conferiu a regra de bloqueio
no `DOCKER-USER`, iniciou os contêineres e confirmou acesso aos metadados pelo
gateway sintético e bloqueio pelo proxy sintético. Após outro reinício, ambos
estavam novamente parados; a regra foi reaplicada antes de iniciá-los e os dois
testes de metadados passaram. O pipeline retornou zero.

Os resultados, com coleta serial e checksums, estão em
`.local/toonlira-public-test-20261103/amd64-docker-nolive-b/evidence/volatile/`.
SHA-256 do pipeline:
`88f52e49663ce149e556681fe4fd5a3a7d31978d6fdb016f2e91f79071fd00e7`;
do log operacional:
`8b9a5f6e423a47977e0f5ed0b104082a5f79bbd08e4330b96bc3f0cbd2832d29`;
do resultado:
`c5897b34b4a2bebf2b1def02084fb27371f16780d821c30fc80d1f7c6111c563`.
O diário da rodada registra remoção da VM e disco, binding, identidade,
sub-rede e rede, com `cleanupErrors: []`.

A rodada anterior `mob020-meta-cc376a91` terminou com código 125: a prova
esperava encontrar o proxy em execução após o primeiro reinício, mas ele já
estava parado. Ela não é considerada aprovada; sua limpeza também registrou
`cleanupErrors: []`. Os registros históricos foram preservados em
`.local/toonlira-public-test-20261103/amd64-docker-nolive/`.

O teste não mede uma possível janela durante o primeiro reinício e não prova
que a configuração sobreviva a um reboot do COS. O procedimento definitivo
ainda precisa configurar o daemon antes de iniciar a composição, manter o
firewall externo fechado até os testes e ser ensaiado integralmente. As
features 020/021 e a entrega do APK continuam abertas.

## Preparação local do bootstrap

Os arquivos `prepare-docker-and-start.sh` e `configure-docker.mjs` preparam a
configuração antes de executar `start-private-test.sh`: recusam contêineres em
execução ou configuração inesperada, preservam as demais opções do daemon,
reiniciam o Docker e conferem novamente `live-restore=false` e ausência de
contêineres ativos. A validação de sequência e falhas foi executada com
comandos simulados (quatro testes Python); a edição do JSON foi testada em
arquivos temporários (três testes Node). O script existente de inicialização
passou seus quatro testes simulados. Esses testes locais não substituem um
ensaio integral na VM, nem configuram por si só a execução no boot.

O pacote local `bootstrap-bundle-20261104` foi criado com
`prepare-bundle.py`, contendo a composição, scripts e somente os digests
necessários do recibo publicado. Não inclui `settings.env`. A conferência
`shasum -a 256 -c SHA256SUMS` passou para os nove arquivos; os três testes do
empacotador cobrem integridade, recibo inválido e preservação de destino
existente. O pacote ainda não foi transferido nem executado na VM.

## Ensaio integrado e correções

A rodada privada `mob020-meta-c6f3ab28`, com IP e credenciais sintéticos,
validou o pacote e alcançou a criação da composição. Identificou primeiro que
os contêineres Node de preflight e verificação de metadados não conseguiam
ler os arquivos privados de propriedade de root. O bootstrap foi corrigido
para executar esses verificadores como root, com capacidades removidas e
sistema de arquivos somente leitura; o preflight continua sem rede.

Após a correção, o preflight passou e o Compose criou as redes e os quatro
contêineres, mas o início do proxy falhou com `Address already in use`. Uma
possível colisão entre alocação dinâmica e endereços fixos da rede privada foi
mitigada separando a faixa dinâmica `172.30.242.128/25` dos endereços fixos
`.2` e `.3`. Esta hipótese e a composição corrigida ainda exigem nova prova;
o log não identifica sozinho a origem do conflito. A quarentena permaneceu
ativa e o diário confirma a limpeza da VM, disco e recursos temporários com
`cleanupErrors: []`. Não se deve considerar esse ensaio como validação de
HTTPS ou de providers reais.

A rodada posterior `mob020-meta-b407da26` usou a faixa dinâmica separada e
iniciou os quatro contêineres, com preflight aprovado, IPs fixos do proxy
conferidos, IPv6 desativado e verificações de metadados aprovadas. O resultado
foi `private-integrated-bootstrap-passed` e código zero. Isso é consistente
com a hipótese de colisão de IP anterior, mas não identifica por si só a
causa exata do erro anterior. A prova usou cópias instrumentadas, IP público
fictício, segredos sintéticos e bloqueios adicionais de saída; não exercitou
TLS público, uma chamada real, reboot da VM nem o Android.

Evidências em
`.local/toonlira-public-test-20261103/amd64-compose-bootstrap-g/evidence/volatile/`.
SHA-256 do pipeline:
`94119927373d5e2a07e1773ac92968bd45717c3b830ae60015c1dc2668a409ac`;
do log operacional:
`27d1ae003382404cc61c18165a1a15738cb6f9441c046ce3a543d2874331c0fa`;
do resultado:
`730ee6f5bbb9fdb2fd3c2c3d3d70aafe46566a6039dfd14b3cc3cd03bc02a380`.
O diário registra remoção da VM e disco, binding, identidade, sub-rede e rede,
com `cleanupErrors: []`.

A rodada privada seguinte `mob020-meta-fc1d2e80` tentou, pela rede interna e
limitador, consultar capabilities e criar identidade e sessão sintéticas. A
consulta de capabilities não ficou disponível no prazo, portanto identidade e
sessão não foram comprovadas nessa rodada. A composição e as verificações de
metadados haviam iniciado antes da tentativa. A origem da indisponibilidade
não foi determinada; o verificador foi ajustado para registrar somente o
último status HTTP ou categoria de erro de rede, sem credenciais. Evidências
em `.local/toonlira-public-test-20261103/amd64-compose-identity/`; o diário
registra `cleanupErrors: []`.

O diagnóstico `mob020-meta-de41b7e8` retornou HTTP 503 enquanto os quatro
serviços permaneciam ativos. A configuração sintética usava uma versão de
aviso incompatível com `VolatileGatewayPolicy`; o preflight foi corrigido para
validar a versão, contato, limites textuais e formato da chave antes de iniciar
os serviços. Os testes de regressão de configuração passaram.

Na rodada `mob020-meta-5b2943d1`, com aviso sintético válido, o limitador e o
gateway responderam à consulta de capabilities; a criação de identidade e
sessão sintéticas retornou 201 e a credencial inválida foi rejeitada com 401.
Resultado `private-identity-capabilities-passed`, SHA-256
`012f3b98170ff89ca5a2ee2b991cf6f046422419f3f16e04388c3eae720bf0c0`;
pipeline SHA-256
`25ef7ac34cf116e191a80998ed8bd26253681eaf81bb49f868452904400a1a22`.
Evidências em `.local/toonlira-public-test-20261103/amd64-compose-identity-c/`;
o diário registra remoção dos recursos com `cleanupErrors: []`. O ensaio usa
IP e credenciais sintéticos e não demonstra HTTPS público nem provider real.

A rodada `mob020-meta-bdf73c42` verificou recuperação após reinício manual do
Docker na mesma VM privada. Após a criação de identidade sintética, reiniciou
o daemon, conferiu que os contêineres estavam parados, executou novamente o
bootstrap, conferiu os quatro contêineres e a igualdade da contagem de linhas
de `anonymous_installations`, e repetiu com sucesso a prova de capacidades e
identidade. Resultado `private-docker-restart-passed`, SHA-256
`3e45a7c234b298ebf001bab6a85940a0a5eafce735492c6ad7b919063a6b3e02`;
pipeline SHA-256
`9998592b46b3e41e682a1f4da5cd6ccc4574c031c74b2bdeb6bc9bf50235c34a`.
Evidências em `.local/toonlira-public-test-20261103/amd64-compose-restart/`;
limpeza com `cleanupErrors: []`. O bootstrap foi acionado manualmente e a
igualdade da contagem não comprova cada registro ou a reutilização da mesma
credencial. O teste não substitui reboot completo da VM, TLS ou providers reais.

## Preparação de inicialização no boot

`create-startup-hook.mjs` gera um script de metadados sem senhas, que fixa o
hash do manifesto, confere os nove arquivos do pacote e exige `settings.env`
regular com modo 0600 antes de chamar o bootstrap. Os testes locais cobrem
recusa de pacote alterado e presença das verificações. O hook preparado para
`bootstrap-bundle-20261104-d` tem SHA-256
`8fd3af5bf9e3917d98e266ef923c5a6784239f1b03b20922d0a6d92cb97ab4f0` e passou
`bash -n`; não foi instalado ou executado em reboot de VM. Regerar o hook após
qualquer alteração do pacote. A configuração privada precisa ser provisionada
separadamente, sem embutir credenciais nos metadados. O comportamento de
startup no COS é descrito na [documentação oficial](https://docs.cloud.google.com/container-optimized-os/docs/how-to/create-configure-instance).

A rodada privada `mob020-meta-e67a3c42` executou reboot completo do COS125 na
mesma VM, conferindo mudança de boot ID. Um startup-script de teste executou o
hook gerado antes e depois do reboot; a contagem de instalações sintéticas foi
igual, os quatro serviços voltaram e capacidades, identidade e sessão passaram
novamente. Resultado `cos-reboot-startup-passed`, SHA-256
`93653166a9ba9bac6bb33eca0d404d97a43ef67f441325862e6e68a33bd324fa`;
pipeline SHA-256
`81d135f08c4e2a10c830bd2073f4071548a02c1d1fb3f3726d8ebc6ae3eea961`;
startup de teste SHA-256
`7a1799189d53d764d81117d5deb250dfcfb2e7fbac69da90a047612ced20b3aa`.
A VM, disco e recursos temporários foram removidos (`cleanupErrors: []`). A
prova usou bundle instrumentado, endereço e credenciais fictícios e bloqueios
adicionais de saída, sem HTTPS público ou providers reais. Ela não comprova a
instalação e provisionamento do hook definitivo na futura VM nem a reutilização
da mesma credencial anterior.
