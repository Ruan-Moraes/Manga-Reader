# Adapter de coleta VM e identificação do COS — 2026-10-12

**Adapter preparado/testado offline; não utilizado com credenciais reais.**
Continua o [launcher/core de coleta](worker-isolation-vm-preparation-2026-10-12.md).
Sem criação, grant, push, execução de VM, chamada a provider, instalação ou
mudança de runtime/default. 020 `in-progress/open`; 021 bloqueada.

## 1. Preparação privada

Parcela `compute-reader.343LqZ` no diretório local ignorado de isolamento.
`reader.mjs` implementa transporte gcloud GA com comandos fixos e adapter para
o core anterior; `reader.test.mjs` usa runner/processos falsos. Importar os
módulos não inicia processos, rede ou leitura de credenciais. Não há CLI de
ativação automática; o adapter é composto explicitamente com `collect`.
Os scripts próprios são JavaScript; probe Java e SDK Google já instalado
permanecem existentes, sem novo Python/C de aplicação ou dependência adquirida.

Opções são copiadas defensivamente: nome exclusivo, zona São Paulo, ID numérico
da VM, rodada, hash da identidade/configuração e confirmação `READ_ONLY_VM:<id>`.
Isso protege contra uso acidental; **não substitui autorização humana**. IDs
reais e hash do pacote aprovado devem vir da criação/readback futuros, nunca das
fixtures ou do exemplo. VM ainda não existe; nenhuma confirmação de uso real
da credencial foi inferida de «Vamos indo» nesta preparação offline.

Comando reproduzível da preparação, da raiz:

```bash
node --test .local/worker-isolation/compute-reader.343LqZ/reader.test.mjs
```

## 2. Consultas permitidas e integridade do alvo

Uma leitura do adapter faz somente:

1. `config list` de campos mínimos da fonte/configuração, sem token ou senha.
2. `compute instances describe` e `compute disks describe` do alvo exato.
3. `compute instances get-serial-port-output`, serial **2**, cursor explícito.
4. Nova consulta do disco e da VM; só então retorna o envelope ao core.

Projeto/zona e formato JSON são explícitos, sem discovery de zona ou fallback.
Identidade é fixada no comando de recurso somente após conferir seu hash.
Nenhum argumento arbitrário, `alpha`/`beta`, SSH, token exportado, login,
impersonação, enable, start, execute, reset, create/delete ou mudança IAM.
Comandos podem ter retries internos de **leitura** do SDK; não são chamadas
cobradas de OCR/tradução ou reexecução da VM/probe. Prazo global do core continua
limitado; confirmação perdida jamais provoca mutação/repetição de processamento.

Antes da serial, exige VM `RUNNING` com ID esperado, tipo 2 CPUs/16 GiB,
NIC/rede/subnet dedicadas, nenhum IP externo/IPv6, SA dedicada e scope esperado,
um boot disk padrão, auto-restart desligado, tempo 900 s/STOP e Shielded flags.
Metadata exige só os cinco campos previstos, incluindo hash exato de `user-data`;
script adicional, duplicação ou drift bloqueiam a leitura serial.

Disco exige nome/zona, vínculo à única VM, tamanho/tipo e nome **e ID** da imagem
COS pinada. ID do disco fica retido para impedir troca entre polls; disco/VM
são revalidados após a serial. ID da imagem identifica a versão mesmo diante de
recriação de nome, conforme o [contrato Disk](https://docs.cloud.google.com/compute/docs/reference/rest/v1/disks).
Isso não é snapshot transacional/attestation de todo o host e não verifica IAM,
PGA/firewall/políticas efetivas, código do Docker ou limites dentro do container.

O [comando serial GA](https://docs.cloud.google.com/sdk/gcloud/reference/compute/instances/get-serial-port-output)
foi conferido também no source do SDK instalado: devolve recurso com `contents`,
`start` e `next`; formato default imprime texto, portanto o adapter exige JSON.
Gap/cursor incorreto, limite de bytes, VM parada/trocada ou resposta incerta
viram erro sanitizado. Envelope serial fica só em memória; apenas o core filtra
o frame e produz o relatório seguro. **Não imprimir/persistir `read()` diretamente**,
pois seu envelope interno inclui o conteúdo serial necessário ao parser.

## 3. Credenciais, processo e logs

Runner real continua dormente nesta entrega; todos os testes injetaram processo
ou transporte falsos. Quando autorizado, usará somente `/opt/homebrew/bin/gcloud`
existente, `shell=false`, stdin fechado, stdout bounded de 8 MiB e stderr descartado
com teto de bytes. Nenhuma resposta bruta/exceção vai para console, arquivo ou
resultado público. O account é passado internamente em argumento para fixar a
fonte; não registrar argv integral, e-mails ou conteúdo de config/metadata.
Tokens não são argumentos, resultados nem artefatos.

Ambiente preserva HOME/PATH normais, rejeita overrides de autenticação/Python/API
e não repassa ADC, proxy ou outras variáveis arbitrárias. Fixa Google APIs e TLS
verificado apenas no subprocesso; flags de logs HTTP/file, telemetria, prompts e
update-check desabilitados. Endpoint/TLS/CA/proxy/universe inesperados no retorno
de configuração impedem consultas de recurso. Não alterar config persistente,
ADC ou credential store por fallback. O CLI ainda pode atualizar caches normais
da credencial; não alegar ausência de toda escrita interna após uso futuro.

Propriedade `core.disable_file_logging` e `exec` do launcher SDK para seu Python
foram verificados por leitura local do vendor source, não execução de gcloud.
Isso configura proteção, **não demonstra comportamento real do SDK no alvo**.
Manifests do SDK precisarão ser conferidos antes/depois do uso real; nenhum
componente ausente pode ser instalado implicitamente para completar a coleta.

Cancelamento/prazo/overflow tenta SIGTERM, depois SIGKILL na própria CLI, sem PID
arbitrário. Capacidade permanece busy até `close`, inclusive após abort/error;
não inicia substituição enquanto uma CLI incerta ainda existe. Testes falsos
verificam essa retenção e a sanitização, não terminação real de processo Google.
Não usar a ferramenta para parar/deletar VM; retirada é ação separada autorizada.

## 4. COS: identificação publicada da revisão exata

A documentação oficial indica metadados públicos por build no
[acervo COS](https://docs.cloud.google.com/container-optimized-os/docs/resources/sources).
Em 12/10 às **19:58–19:59 de Brasília**, JSON público do build `19216.739.5`
foi consultado por HTTPS, sem credencial, header Authorization ou SDK. Somente
83.487 bytes de texto em memória; nenhum SO, kernel, pacote ou executável adquirido.

Fonte: [cos-package-info.json do build](https://storage.googleapis.com/cos-tools/19216.739.5/cos-package-info.json).
SHA-256 da resposta:
`8f420e136f8d5665f9e9610cd69e37a1f2cef4ed597cb5b7bf2709f974a846c9`.
327 entradas de pacotes instalados; as seis selecionadas têm `version` igual ao
build. A versão de pacote está em **`ebuild_version`**, não nesse campo `version`.

| Componente publicado                   | Revisão ebuild  |
| -------------------------------------- | --------------- |
| `sys-kernel/lakitu-kernel-6_12`        | `6.12.112-r240` |
| `app-containers/docker`                | `27.5.1-r1`     |
| `app-containers/runc`                  | `1.3.6-r2`      |
| `app-containers/containerd`            | `2.2.7-r1`      |
| `sys-apps/systemd`                     | `254.26-r11`    |
| `app-containers/docker-credential-gcr` | `2.1.32-r1`     |

Primeiro extrator supunha categoria/nome combinados e selecionou zero entradas.
Recibo inicial preservado; inspeção do formato esclareceu os campos, e segunda
seleção conferiu novamente o hash original e o build antes de registrar fatos.
Não declarar fonte ausente ou alterar silenciosamente a evidência anterior.
Os scripts públicos têm destinos write-once; não reexecutar sobre esses recibos.

**Identificação fechada, segurança ainda parcial.** Hash identifica o documento
obtido, não os bytes/assinatura do SO ou imagem de boot efetiva. É associação
publicada ao build, não prova de kernel/runtime em execução, backports íntegros,
ausência de CVEs ou cobertura do JRE da imagem diagnóstica. As release notes
consultadas continuam sem essa revisão exata; não copiar patches de outro build.
O modelo de host/kernel/Docker na fixture de teste continua sintético e distinto
dessas versões publicadas, nunca evidência de execução.

## 5. Testes, hashes e próximo gate

TDD: módulo ausente reproduzido antes de implementar; casos de endpoint/TLS e
hashes largos ficaram vermelhos e depois verdes. Campos aninhados malformados
são sanitizados, opções copiadas e nenhum runner invocado sem acknowledgment.
Doze testes do adapter, onze do launcher/core e oito regressões leves do módulo:
**31 aprovados, zero failures/skips**, somente fixtures/processos falsos e JDK local.
Nenhum Docker, provider, banco, credential ou SDK executado.

| Artefato privado    | SHA-256                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `reader.mjs`        | `b5f5963c768183c6465dc68e02e04a8b220ba8a10aed61bc762b743d72cecb67` |
| `reader.test.mjs`   | `968537ee1cf064b5ae6010289ab6a150ec9a800ab2ec80360f439375d80ec134` |
| Seleção factual COS | `90f43d0f1d2636828518f7b39482aea99271a58fc99dbe24a71c885d78eeb987` |

Estes hashes cobrem preparação local ignorada, não o checksum técnico Java.
Fontes/gates/hashes históricos preservados; não redatar review SDD/feature ou
afirmar Maven/web/mobile aprovados por testes desse adapter.

Próximo: revisar vulnerabilidades/backports dos componentes identificados e
imagem/JRE, validar semântica Linux da unidade e completar preflight de nomes,
CIDR, IAM/PGA/políticas. Depois apresentar aprovação dos alvos novos, custo,
publicação/criação/execução e retirada. Não usar credencial ou iniciar VM para
antecipar essas decisões. Gateway/worker/rendering continuam desabilitados.

Fechamento às **20:04 de Brasília**: 35 links locais, hashes e sintaxe dos
scripts, formatação direcionada e diff-check do gateway aprovados. Os 419
arquivos técnicos continuam byte-idênticos à fotografia
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`,
incluindo conjunto de caminhos. Novo preparo privado ocupa menos de 64 KiB,
sem cache grande ou arquivo de performance. Scan de padrões de chave/token
sem achados; não é auditoria de segurança exaustiva.

Global mantém o EOF alheio em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`;
Maven/web/mobile/SDD não reexecutados para redatar seus gates por tooling
preparatório ignorado/documentação. Este resultado não promove a 020/021.
