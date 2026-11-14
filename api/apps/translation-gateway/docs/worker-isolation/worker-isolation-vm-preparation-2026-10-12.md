# Preparação local do launcher VM — 2026-10-12

**Rascunho local testado offline; nenhuma VM, publicação, credencial ou cobrança.**
Continua a [receita candidata](worker-isolation-vm-recipe-2026-10-12.md).
Não modifica fontes/configurações do gateway, runtime, Terraform, migrations,
defaults ou contratos. 020 permanece `in-progress/open`, 021 bloqueada.
Continuação: [adapter read-only preparado e componentes COS identificados](worker-isolation-vm-reader-2026-10-12.md),
sem uso de credenciais ou prova no host. Pendências abaixo preservam a fotografia
anterior à implementação desse adapter.

## Entregas e o que ainda não entregam

Preparação em diretório exclusivo local ignorado pelo Git, parcela
`compute-launcher.IiCpiA`, sem pacote/dependência nova. Lógica própria somente
JavaScript; o probe continua Java. Configuração YAML/systemd usa comandos do
SO existente; não adiciona script Python/C/shell de aplicação.

| Artefato local      | Entrega                                                                                                                           | Limitação                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `launcher.mjs`      | Gerador de cloud-init/unidade/proposta; reserva local exclusiva, hashes, parser serial e polling bounded com transporte injetado. | Não executa Docker/gcloud, não lê ADC, não cria recursos.                    |
| `launcher.test.mjs` | Fixtures sintéticas de segurança, falhas, concorrência e protocolo.                                                               | Não são observações na VM ou teste de systemd.                               |
| `verify-local.mjs`  | Verifica hashes existentes de imagem/scan/fontes e gera um pacote novo write-once.                                                | Não faz novo scan ou aprovação CVE; diretório existente impede repetição.    |
| `prepared/`         | `cloud-config.yaml`, unidade systemd, proposta e recibo dos hashes.                                                               | Proposta não é request `instances.insert` executável/aprovado.               |
| `evidence.json`     | Fotografia técnica da preparação e revisão parcial.                                                                               | A limitação inicial sobre parser YAML foi esclarecida posteriormente abaixo. |

Exemplo usa IDs **propostos** `vm-diag-20261012-prep` e
`toonlira-vm-diag-20261012-prep`, zona a. Não comprova disponibilidade ou autoriza
usar esses nomes. Política/rede/CIDR/permissões e caminho publicado ainda faltam.
Não reutilizar recursos de mesmo nome ou a conta antiga retirada.

## Anti-repetição e isolamento propostos

A [documentação COS](https://docs.cloud.google.com/container-optimized-os/docs/how-to/create-configure-instance)
informa que cloud-init pode rodar em cada boot. Portanto a unidade primeiro
reserva `mkdir` sem `-p` para a rodada, seguido de `sync -f`, em diretório dedicado
sob `/var/lib`; ambos precedem pull/probe. Colisão ou falha impede lançamento.
`/var` é stateful no [layout COS](https://docs.cloud.google.com/container-optimized-os/docs/concepts/disks-and-filesystem);
`/etc` e `/var/lib/cloud` não são lugares admitidos para esse marcador.
Reboot não autoriza apagar o intent nem repetir uma rodada ambígua.

Container proposto: digest histórico pinado, pull no host e `--pull=never` na
execução; restart desabilitado, PID 1 Java, UID/GID 1000, sem rede, ports, binds
ou credenciais. Rootfs readonly, cap-drop ALL, no-new-privileges, cgroup privado,
2 CPUs/8 GiB, swap combinado 8 GiB, PIDs 64 e scratch tmpfs 512 MiB com flags
noexec/nosuid/nodev. Nenhum guard foi alterado para essa configuração passar.

CredHelpers estático e `DOCKER_CONFIG` dedicado no host, sem redefinir HOME,
exportar token ou montar auth na aplicação. Pull usa apenas a identidade dedicada
futura e seu acesso reader ao repo temporário. Não existe essa identidade/push
por efeito do gerador; scope OAuth não substitui IAM.

Unidade `oneshot`, `Restart=no`, timeout de 180 s e tentativa de encerrar somente
o container nomeado da rodada no stop-post, sem remoção abrangente. Falha/timeout
de Docker ou do stop não comprova terminação: conservar estado ambíguo e não
relançar. O marcador e a saída serial real ainda precisam de prova no COS.

Proposta de VM traz `maxRunDuration=900 s`, ação `STOP`, sem auto-restart ou
retomada/retry. Configuração descrita na [API de tempo de vida](https://docs.cloud.google.com/compute/docs/instances/limit-vm-runtime);
**não configurada no projeto**. Quinze minutos não são teto de cobrança; a
coleta precisa terminar antes do stop, e disco/registry continuam cobrando até
retirada autorizada. A cotação anterior de dez minutos é exemplo, não essa
aprovação de runtime ou orçamento.

## Coleta: core pronto, adapter Google ainda pendente

Saída exclusiva proposta na serial **2** (`/dev/ttyS1`), stdin null, stdout tty,
stderr null. Não usa console interativo, Cloud Logging adicional ou auth em logs.
Fontes primárias de semântica:
[systemd stdout/TTY](https://github.com/systemd/systemd/blob/v255/man/systemd.exec.xml),
[stop-post/SERVICE_RESULT](https://github.com/systemd/systemd/blob/v255/man/systemd.service.xml).
Isso não comprova existência/permissões do dispositivo ou versão do systemd no pin.

Parser exige marcadores únicos da rodada, campos host allowlisted, relatório
exato `1.0` com 18 IDs/checks, Java 25 e flags permanentes de não aprovação.
Preserva FAIL/UNKNOWN; status incompatível, campos extras/sensíveis, duplicação,
outra rodada ou corpo inválido são rejeitados. Normaliza apenas CRLF do transporte;
hash é do JSON capturado com LF, não alegação de bytes originais antes do tty.

Polling de leitura: cursor de bytes sem gaps, alvo por ID numérico, até 1 MiB
acumulado, probe até 16 KiB, intervalo de 5 s, até 10 minutos/120 consultas e
deadline de leitura 10 s. Chunks parciais ficam pendentes; transporte incerto,
VM parada ou interrupção não causam novo lançamento. Read pendente é abortado;
não é substituído automaticamente por outra consulta. Falhas preservam códigos
fixos; nenhuma exceção bruta ou log serial fora do frame é retornado/persistido.

**Falta o adapter autenticado somente leitura**, que deverá unir describe/ID
efetivo e GET serial-2 bounded, respeitar AbortSignal, validar estado/identidade
e entregar o envelope ao core sem guardar resposta/log bruto. Não instalar SDK,
abrir SSH, usar IAP, reter token ou executar VM para preencher esse adapter.
Nesta parcela `collect` recebeu somente callbacks falsos nos testes.

## Revisão parcial de segurança, não nova aprovação

Imagem exportada e scan OS existentes conferidos integralmente por hash:

- Export: `7f73fe0fe203ea1b37bd0d57a3da135f351afb3beca870bc4866eedc87c19ca5`.
- Scan: `7f06cafb668a5f30000cbd16180efc154892c143e484eecffae04a23988ee46e`.
- Config da imagem: `sha256:9f19c1a43220798038bd89702b2d4ce8a64a8fe4acbcc6f8e5be13d98c5046bd`.

Scan histórico de 12/10 às 13:01 de Brasília: 16 ocorrências/10 CVEs,
12 MEDIUM/quatro LOW, somente OS-pkgs. Não é cobertura integral de JRE, ausência
de exploração ou novo scan nesta etapa. Aprovação restrita anterior do
[diagnóstico Cloud Run](diagnostic-publication-review-2026-10-12.md) não aprova
automaticamente um novo host VM. Bases/cache descartados seguem ausentes;
nenhum banco de vulnerabilidades, modelo ou imagem foi reconstruído/baixado.

A consulta às [release notes COS 125](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m125)
e busca focada em fontes oficiais não localizaram a revisão exata
`cos-125-19216-739-5`. Metadata observada continua válida como identificação,
**não verificação de patches/kernel/Docker/runc**. Não copiar números de uma
revisão vizinha ou trocar pin silenciosamente. Segurança permanece parcial.

## Testes e rastreabilidade desta etapa

TDD local: ausência do módulo reproduzida antes da implementação. Um teste de
falha encontrou vazamento de exceção da espera/polling; callback agora sanitizado,
com regressão verde e sem outra leitura agendada. Fixtures são sintéticas e não
usam mídia/segredo/provider. Onze testes novos aprovados; oito testes leves
existentes reexecutados separadamente. Nenhuma prova real na VM.

Comando do preparo local, da raiz, usando a parcela preservada:

```bash
node --test .local/worker-isolation/compute-launcher.IiCpiA/launcher.test.mjs
```

O pacote já foi gerado; não reexecutar `verify-local.mjs` sobre ele, não editar
os arquivos readonly/hashes ou reaproveitar ID. Uma nova preparação deve ter
diretório/ID próprios e nova evidência, sem executar ações cloud implicitamente.

Sintaxe YAML validada **sem write** pelo Prettier já instalado. A tentativa
inicial de resolver diretamente o módulo `yaml` não o encontrou nos dois
pacotes; o parser embutido do Prettier permitiu a verificação depois, sem instalar.
Preservada a fotografia inicial e registrado o esclarecimento; ela não deve ser
citada como ausência de todo parser. `systemd-analyze` não encontrado no PATH
macOS: validade semântica Linux/dispositivos/boot ainda não comprovada.

Hashes do pacote gerado:

| Item              | SHA-256                                                            |
| ----------------- | ------------------------------------------------------------------ |
| Cloud-config      | `a5614e879b0aa31eb145b5d46f1e9620422a7ad7f72957cabd34db1b78ad5f11` |
| Unidade systemd   | `9e2c709f54bc873ffc530bac68ceaea703c71df9fb503a7059e6d9c89c7ddf3a` |
| Evidência inicial | `87d7746ffd20078d218ab6f9545cb651cf6d08fbeb9c5e78f988d6a10cdfd5e8` |

419 fontes/testes/configurações do gateway continuam byte-idênticos à fotografia
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Scripts preparatórios ficam fora desse checksum/Git; não afirmar que o checksum
Java cobre o novo gerador local. Registro atual vincula seus próprios hashes.
Sem redatar Maven/web/mobile/SDD por configuração preparatória ignorada e docs;
não é declaração de todos os gates globais verdes.

Próximo trabalho seguro: adapter de coleta read-only e revisão restante do pin/
host/imagem, ainda offline/somente leitura. Só então pedir aprovação delimitada
dos recursos novos, grants, publicação, runtime/custo e retirada. Não adquirir
pacotes/índices, criar VM ou usar credenciais por consequência deste relatório.

Fechamento às **19:17 de Brasília**: pacote/fonte/hashes conferidos, 19 testes
leves aprovados, sintaxe dos três scripts válida, 30 links locais verificados,
Prettier direcionado e diff-check do gateway aprovados. Global mantém o EOF
externo em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`, sem
correção automática. Artefatos novos totalizam menos de 64 KiB; nenhum cache
grande, aquisição/instalação, arquivo de performance ou recurso cloud alterado.
