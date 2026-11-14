# Revisão parcial de segurança da candidata VM — 2026-10-13

**Criação/execução bloqueadas pela revisão de segurança; nenhuma VM iniciada.**
Continuação do [adapter e inventário COS](worker-isolation-vm-reader-2026-10-12.md).
020 permanece `in-progress/open`; 021 bloqueada. Nenhum guard, default, fonte
de produção, imagem ou infraestrutura foi alterado para contornar o resultado.

## 1. Escopo e rastreabilidade

Somente leitura local e HTTPS público oficial, sem Google SDK/credenciais,
instalação, download de binários, upload, grant, recurso ou chamada a provider.
Fontes upstream foram tratados como dados, nunca executados. Metadados e trechos
selecionados ficam na parcela privada ignorada `vm-security.9ZSP0D`, em recibos
exclusivos; não reexecutar os scripts sobre esses destinos já preenchidos.

Candidata continua `cos-cloud/cos-125-19216-739-5`. O
[manifest público do build](https://storage.googleapis.com/cos-tools/19216.739.5/manifest.xml)
fixa overlay `a58595c202c05e74f6919718dc36bc77e665d3f9`, Docker
`fe7bccba4bc271c06352974b1a8df4501f05d903` e containerd
`89a34797ccdcdd55e21154472286bd648fdabf8a`. SHA-256 do XML:
`2807a3fc11288fb9d251ecddd6f90e09f56692276a2a64e2cfa2899fd290932d`.
O ebuild selecionado aponta ao mesmo commit Docker, não a outra branch no XML.
Isso vincula **fontes publicados**, não atesta os bytes ou execução do host.

Consultas às APIs públicas de advisories dos maintainers retornaram 13 registros
de runc, 29 de containerd e 26 de Moby, sem próxima página indicada. Inventário
não equivale a avaliação de todos os CVEs, dependências transitivas ou kernel.

## 2. Finding bloqueante: pull e credencial do registry

[CVE-2026-92543 / GHSA-7cfq-22r6-qp73](https://github.com/moby/moby/security/advisories/GHSA-7cfq-22r6-qp73)
foi publicada em 01/10, severidade alta. Upstream corrigiu em Docker 29.8.2;
a base 27.5.1 está no intervalo anterior, mas **a versão sozinha não decide o
estado de uma distribuição com backports**.

Conferência do
[ebuild Docker pinado](https://cos.googlesource.com/cos/overlays/board-overlays/+/a58595c202c05e74f6919718dc36bc77e665d3f9/project-lakitu/app-containers/docker/docker-27.5.1-r1.ebuild)
identificou patches declarados para CVEs 33997, 34040, 41568, 41567 e 42306 de 2026. Seus headers apontam a plugin, authorization e archive/containerfs;
o patch genérico da issue 52653 também modifica containerfs, não registry.
Não tratar todos esses CVEs como ausentes de correção apenas pela versão base,
nem atribuir patches somente porque seus arquivos aparecem no diretório.

Além do inventário, foram lidos os fontes do commit efetivamente selecionado:

- [registry/config.go](https://cos.googlesource.com/third_party/docker/+/fe7bccba4bc271c06352974b1a8df4501f05d903/registry/config.go): inclui loopback IPv4 por padrão e retorna correspondência ao encontrar **um** IP em CIDR inseguro, mesmo havendo outros endereços.
- [registry/registry.go](https://cos.googlesource.com/third_party/docker/+/fe7bccba4bc271c06352974b1a8df4501f05d903/registry/registry.go): a classificação insegura desativa verificação TLS.
- [registry/service_v2.go](https://cos.googlesource.com/third_party/docker/+/fe7bccba4bc271c06352974b1a8df4501f05d903/registry/service_v2.go): usa essa classificação no endpoint e admite fallback HTTP.

**Conclusão de revisão estática:** a lógica problemática permanece nos fontes
publicados selecionados e não foi demonstrado um backport que a remova.
Não houve exploit, pull, boot ou prova binária; não alegar exposição efetiva da
conta. Essa ausência de garantia já impede aprovar a receita para usar uma
credencial no pull do host.

O alerta afeta o **daemon do host**, antes do container. `--network=none` protege
a aplicação, não o pull; digest fixo protege contra substituição de imagem, mas
não evita vazamento da credencial nesse cenário. PGA básico não foi validado
como allowlist de saída do daemon. Não remover apenas `insecure-registries` ou
confiar no certificado/digest como correção suficiente.

## 3. Outros componentes: o que foi e não foi fechado

| Componente           | Observação limitada                                                                                            | Pendência                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| runc 1.3.6-r2        | Base posterior às correções das falhas de escape de novembro/2025 e da 41579 na linha 1.3.                     | Dependências, backports completos e binário não atestados; sem alegação de zero CVEs.      |
| containerd 2.2.7-r1  | Base fora do intervalo da 95837 e posterior às correções 2.2.5 identificadas.                                  | 53493, 53495 e 95838 ainda exigem conferência dos fontes/backports e superfície efetiva.   |
| Kernel 6.12.112-r240 | `kernel_commit` e manifest coincidem; defconfig publicado inclui cgroups, memória, PIDs, namespaces e seccomp. | Isso não é config efetiva, auditoria CVE integral ou prova de cgroup v2 no host.           |
| systemd 254.26-r11   | Manuais upstream v254 contêm as diretivas e `SERVICE_RESULT` usados pela unidade.                              | Presença documental não é `systemd-analyze verify`, boot, device serial ou execução Linux. |
| Helper 2.1.32-r1     | Identificado pelo inventário publicado.                                                                        | Revisão de dependências, credencial e binário permanece aberta.                            |

[53493](https://github.com/containerd/containerd/security/advisories/GHSA-pg57-6jwg-q645)
e [95838](https://github.com/containerd/containerd/security/advisories/GHSA-rp3h-jf77-q9p4)
envolvem processamento de imagens; [53495](https://github.com/containerd/containerd/security/advisories/GHSA-7jxh-36q5-gcqv)
envolve CRI ExecSync. A proposta não usa Kubernetes/ExecSync, mas isso não prova
que o plugin esteja desabilitado. Ainda não foi atestada a configuração real.
Para [46680](https://github.com/containerd/containerd/security/advisories/GHSA-fqw6-gf59-qr4w),
a descrição lista correção em 2.2.4: não classificar 2.2.7 como afetado somente
pelo intervalo aberto da seção de versões do advisory.

Manuais lidos da tag v254: [service](https://github.com/systemd/systemd/blob/v254/man/systemd.service.xml),
[exec](https://github.com/systemd/systemd/blob/v254/man/systemd.exec.xml) e
[unit](https://github.com/systemd/systemd/blob/v254/man/systemd.unit.xml).
Nenhuma instalação para obter verificador Linux foi iniciada.

## 4. JRE e imagem diagnóstica

A [API oficial Adoptium](https://api.adoptium.net/v3/assets/latest/25/hotspot?architecture=x64&image_type=jre&os=linux&vendor=eclipse)
retornou `jdk-25.0.4.1+1`, Linux x64/JRE. Coincide com `JAVA_VERSION` do registro
local de imagem. SHA do archive publicado coincide com o valor no histórico de
build: `1731a34baadec5479258ea0202e4d5d865d2efeee60cb0c7d7eb056fe96ca219`.
**Versão/histórico não verificam novamente o binário nem demonstram ausência de
vulnerabilidades.** Nenhum JRE, base ou pacote foi baixado/instalado.

O scan de 12/10 continua histórico e OS-only: 108 pacotes, 16 ocorrências,
10 CVEs, 12 médias/4 baixas, sem cobertura integral do JRE. Banco OS temporário
continua descartado. Metadata Java tinha `NextUpdate` em **12/10 às 21:59 de
Brasília**, já ultrapassado nesta revisão. Não houve refresh; atualizar apenas
o Java DB não transforma análise de JARs em auditoria do runtime nativo.
Preservar [as limitações da revisão da imagem](diagnostic-publication-review-2026-10-12.md).

## 5. Evidência local e decisão

| Recibo privado         | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `public-review.json`   | `6aad2743fd54910b3e8de6f5c2e87582ed3fda957e57af4eaaf8a85640c82724` |
| `pinned-sources.json`  | `987106f1509ff75bcf9896ebc1e031c40c7feb9483666fbbb9157a114b114be4` |
| `backports.json`       | `7dd1200a553bdd2302daa9b23215953a2ed9f8512b1eaab23ab11779d8d6f21e` |
| `docker-registry.json` | `9f9e6cfbd5013ee747e029ac86e9ffeb5f0a6e5e9f2e4c73571210db01167c4d` |
| `patch-targets.json`   | `fb0af14bbafba18a1407c61bb442cde9804c069a96c4789fa899c5bec037cc48` |
| `systemd-static.json`  | `a44ae26f926e67ce1052bb7595db78d42719f5a5498e5ed7727ad04d762dc752` |

Reexecutados 27 testes locais: 12 do reader, 11 do launcher/core e 4 regressões
de imagem/probe/runtime, zero failures/skips. Transporte/processos falsos e JDK
local; não são testes na VM ou aprovação de segurança. Não redatar a contagem
histórica de 31 de outra seleção de testes.

**Próximo trabalho:** buscar correção comprovada no SO/runtime candidato antes
de pedir criação financeira. As release notes consultadas de
[125](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m125),
[129](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m129) e
[133](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m133)
não demonstraram a correção 92543; versões base mais novas, sozinhas, não a
resolvem. Não trocar pin automaticamente por beta/família móvel.

Se nenhum pin corrigido puder ser demonstrado, uma receita de DNS/egress do
host conforme mitigação upstream requer desenho e verificação próprios;
não está implementada/aprovada por PGA ou pela rede interna do container.
Depois continuam revisão JRE, prova Linux, preflight de nomes/rede/IAM e
confirmação delimitada de publicação/criação/execução/custo/retirada.
Nenhuma aprovação anterior foi ampliada para essas ações.

Fechamento local em 13/10 às **06:36–06:37 de Brasília**: os 419 caminhos e
bytes técnicos conferidos continuam com SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Export e scan históricos da imagem intactos; 31 links locais nos três documentos
conferidos, sintaxe dos sete scripts e Prettier direcionado aprovados. Parcela
privada menor que 128 KiB; zero achados nos padrões limitados de chave/token,
sem cache grande ou alteração de arquivos de performance.
Recibo `verification.json` SHA-256:
`82b42cc52b4f2cfc7d14f03acee9cfb27e4067f18050ef0d13665b24ac6e639a`.

Diff-check do gateway aprovado. Global preserva a ocorrência externa de EOF em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`.
Maven/web/mobile/SDD não reexecutados por esta revisão documental/pública;
nenhum checksum ou gate histórico foi renovado como nova aprovação.
