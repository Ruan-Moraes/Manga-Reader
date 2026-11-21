# Pull privado: alternativa LTS e mitigação proposta — 2026-10-13

**Preparação local, não implantada nem aprovada para usar credenciais.**
Continua a [revisão de segurança](worker-isolation-vm-security-2026-10-13.md).
020 `in-progress/open`; 021 bloqueada. Nenhum SO, imagem, launcher anterior,
runtime, Terraform, default, dado OCR ou arquivo de performance foi alterado.

## 1. Segunda revisão LTS, sem troca silenciosa de pin

A [tabela oficial](https://docs.cloud.google.com/container-optimized-os/docs/release-notes)
identifica 133 como LTS. A revisão publicada nas
[release notes](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m133),
`cos-133-19999-44-106`, foi investigada por metadados/fontes públicos, sem SDK,
credencial ou download de SO. **Não foi consultada a família móvel autenticada
para afirmar que esse build é o mais recente disponível.**

[Metadados do build](https://storage.googleapis.com/cos-tools/19999.44.106/cos-package-info.json)
indicam Docker `29.4.3-r1`, containerd `2.4.1-r5` e runc `1.5.2-r3`.
O [manifest](https://storage.googleapis.com/cos-tools/19999.44.106/manifest.xml)
fixa overlay `42b9c80d8612b7b8ea6c370bfc3245c98a5eb413`; o
[ebuild selecionado](https://cos.googlesource.com/cos/overlays/board-overlays/+/42b9c80d8612b7b8ea6c370bfc3245c98a5eb413/project-lakitu/app-containers/docker/docker-29.4.3-r1.ebuild)
seleciona Docker `56be73107b381194c27938965bca74c4e2bb475b`.

Houve duas limitações preparatórias, preservadas nos recibos: seleção inicial
confundiu `acct-group/docker` com `app-containers/docker`, e caminhos antigos
de registry retornaram 404. Consulta corrigida exigiu categoria/nome, conferiu
novamente hashes de metadata/manifest e resolveu o caminho pela árvore pública.
Não interpretar o 404 de um caminho errado como fonte inexistente ou fix aplicado.

No caminho correto,
[daemon/pkg/registry/config.go](https://cos.googlesource.com/third_party/docker/+/56be73107b381194c27938965bca74c4e2bb475b/daemon/pkg/registry/config.go)
mantém loopbacks inseguros por padrão e correspondência de qualquer IP.
[registry.go](https://cos.googlesource.com/third_party/docker/+/56be73107b381194c27938965bca74c4e2bb475b/daemon/pkg/registry/registry.go)
desativa verificação TLS conforme essa classificação;
[service_v2.go](https://cos.googlesource.com/third_party/docker/+/56be73107b381194c27938965bca74c4e2bb475b/daemon/pkg/registry/service_v2.go)
mantém fallback HTTP. **Esta revisão não demonstrou correção da 92543 e não
será adotada como solução.** Não é exploit ou atestação binária; tampouco prova
que todo COS disponível esteja sem correção. A candidata anterior permanece
pinada e bloqueada; não migrar kernel/runtime por suposição.

## 2. Caminho recomendado para preparar a mitigação

O [maintainer](https://github.com/moby/moby/security/advisories/GHSA-7cfq-22r6-qp73)
admite DNS confiável ou restrição de saída do daemon como mitigação quando não
for possível atualizar. Propor **as duas camadas**, sem declarar o CVE corrigido:

| Camada proposta | Intenção restrita                                                                                                                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DNS             | Uma zona privada somente para `southamerica-east1-docker.pkg.dev.`, vinculada apenas à nova VPC; registro A com os quatro VIPs `199.36.153.4..7`. Sem wildcard, AAAA, forwarding ou peering; SOA/NS geridos pelo serviço são esperados. |
| Rota            | Somente `199.36.153.4/30` via gateway Google; nenhuma rota geral de internet no desenho. Remoção eventual limita-se à rota default gerada na **nova** rede, identificada e autorizada antes de existir VM.                              |
| Egress          | Na VPC dedicada, allow TCP 443 ao VIP, prioridade 1000; deny de demais destinos IPv4, prioridade 1100. Políticas herdadas/efetivas continuam sujeitas a conferência.                                                                    |
| Aplicação       | Container continua sem rede/credencial, mantendo os limites originais.                                                                                                                                                                  |
| Identidade/TLS  | SA sem chave, reader somente do repo; hostname e validação TLS preservados. Não configurar o registry como inseguro.                                                                                                                    |

Fundamentação: [Artifact Registry aceita o VIP](https://docs.cloud.google.com/artifact-registry/docs/securing-with-vpc-sc),
[DNS/PGA](https://docs.cloud.google.com/vpc/docs/configure-private-google-access) e
[rota/firewall privados](https://docs.cloud.google.com/vpc-service-controls/docs/set-up-private-connectivity).
Esse desenho é inferência de engenharia a partir dos mecanismos documentados,
**não validação de conectividade ou mitigação em execução**.

Os VIPs atendem serviços Google compartilhados, não somente nosso repo. Usá-los
não cria um perímetro VPC Service Controls ou isolamento entre projetos.
O [firewall VPC](https://docs.cloud.google.com/firewall/docs/firewalls) não bloqueia
metadata/loopback/tráfego local da VM; DNS, DHCP e tempo dependem do metadata.
Não prometer bloqueio absoluto do host ou aplicar essa exceção à aplicação.
IP externo/IPv6/NAT/SSH/IAP continuam fora da proposta.

Não abrir `34.126.0.0/18`, portas adicionais ou endpoints novos automaticamente
se o pull/redirect falhar. Conectividade direta sugerida na documentação não foi
incluída neste desenho mínimo; incompatibilidade gera bloqueio e revisão.
Não sobrescrever `/etc/hosts` do COS sem conhecer seus arquivos/serviços.

## 3. Rascunho e testes offline

Parcela ignorada `vm-pull-review.m5FOwQ`: `pull-policy.mjs` gera somente um
modelo imutável de **intenção**, sem comandos cloud ou request executável.
`checkRegistryResolution` aceita apenas observações fornecidas, com hostname
exato e lista não vazia de IPv4s únicos do VIP; rejeita loopback, misturas,
IPv6, nomes extras e valores inválidos. Não resolve DNS nem atesta origem/host.

Sete testes escritos antes do módulo ficaram vermelhos por ausência dele e
depois passaram: restrições de rede/DNS, injeção, mistura de endereços,
sanitização, imutabilidade e ausência de operações externas. Com as regressões
anteriores, **34 testes passaram, zero failures/skips**: 7 novos, 12 reader,
11 launcher/core e 4 imagem/probe/runtime. Processo/transporte falsos e JDK
local, não prova Linux ou aprovação operacional.

O rascunho salvo usa nomes **não reservados**, CIDR nulo e aprovações falsas.
Ainda não altera `cloud-config`, unidade ou leitor da parcela anterior.
COS não recebe esse JS automaticamente e não foi presumido Node/Java no host.
A verificação Linux antes do helper/pull exige preparação própria; esse validador
offline não autoriza credencial com base em uma lista sintética ou autorrelatada.
Intenção de HTTPS não é um switch implementado que remova fallback no Docker.

Comando local reproduzível, sem SDK/rede:

```bash
node --test .local/worker-isolation/vm-pull-review.m5FOwQ/pull-policy.test.mjs
```

Recibos de aquisição e `draft.json` são write-once. Regeneração de plano demanda
novo destino; preservar as tentativas iniciais e não sobrescrever evidências.

## 4. Custo novo identificado, não autorizado

A proposta acrescentaria **API Cloud DNS e uma zona privada**, ainda inexistentes
e sem autorização de enable/criação. [Preço público](https://cloud.google.com/dns/pricing)
consultado: sem free tier; primeira faixa US$ 0,000273973 por zona-hora e
US$ 0,40 por milhão de consultas regulares. Fração de hora conta como hora
inteira. Não afirmar cobrança proporcional a dez minutos, faixa efetiva da
conta, imposto, orçamento ou teto; somar este custo ao inventário anterior.
Nada foi habilitado ou cobrado por recursos próprios nesta parcela.

## 5. Rastreabilidade e sequência restante

| Artefato privado       | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| Consulta LTS corrigida | `e2281d435ead690e896f9ffb5032c5964a6535e2028bf1dd5dd97464a3151e3a` |
| Árvore/fontes corretos | `2abe4ea611f6a77b2e97b49180ffb03dddd669a53c82f9ea2a884b909561be5a` |
| `pull-policy.mjs`      | `98c6b1006b09c8920376754abc8115c98cbf1705c4cdce38f8823fcbd0e61e08` |
| Testes da política     | `3a11b76a5c1e827c18fb443624bd8afe4422bf582c057cef4d86b2dcad7ccfb1` |
| `draft.json`           | `b6e552fa9c19891e6b7476cbac15272878489f283fe5b7725d38a8fadd9721e5` |

Próximo: preparar integração e validação Linux fail-closed **antes** de usar
credencial de pull; conferir controles efetivos, compatibilidade de redirects,
segurança JRE/runtime e vínculo da coleta à política revisada. Se exigir nova
instalação, pedir aprovação própria, considerando disco disponível.

Somente depois apresentar alvos, custos, ações e retirada para confirmação de
Cloud DNS/publicação/rede/IAM/VM/execução. Não usar «Vamos indo» como autorização
financeira ou para alterar a rede default/site/bucket OCR. Nenhuma habilitação
de uploads, segunda chamada OCR/tradução ou promoção da 020/021 nesta parcela.

Fechamento local às **07:33 de Brasília**: 419 caminhos/bytes técnicos iguais
à fotografia `1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`;
leitor, teste e cloud-config/unidade anteriores conferidos por hash e intactos.
32 links locais nos três documentos conferidos, sintaxe dos sete scripts e
Prettier direcionado aprovados. Parcela privada menor que 96 KiB após o recibo;
nenhum cache grande ou arquivo de performance alterado. Scan limitado de padrões
de chave/token sem achados, não auditoria exaustiva.

Recibo `verification.json` SHA-256:
`a0d859b790c11371227b6b9272953a077d65b3f7ca89b62b5f106b16088718ca`.
Os scripts públicos registraram 19 leituras, cinco inicialmente inconclusivas
por seleção/caminho, preservadas; o fonte correto foi depois observado. Esses
números não incluem consultas do navegador de pesquisa e não são calls a provider.

Diff-check do gateway aprovado; global conserva o EOF externo em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`. Maven/web/mobile/SDD
não reexecutados para redatar gates por tooling local/consulta pública/docs.
