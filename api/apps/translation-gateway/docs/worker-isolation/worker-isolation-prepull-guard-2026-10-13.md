# Verificador Java antes do pull — 2026-10-13

**Código e integração local preparados; JRE do host não preparado/instalado.**
Continua a [proposta de pull privado](worker-isolation-private-pull-2026-10-13.md).
Nenhuma VM, configuração cloud, credencial Google/registry, instalação, download
de imagem ou chamada a provider nesta parcela. 020 `in-progress/open`; 021 bloqueada.

## 1. Verificação e limites

`PrePullGuard.java`, na parcela ignorada `prepull-guard.M2ONsf`, tem hostname
fixo, lista dos quatro IPv4s do VIP e ativação somente com `--probe-registry`.
Sem modo explícito, encerra com código 2 antes de rede. Não aceita destino,
credencial, jobRef, arquivo de imagem ou resposta OCR por argumento.

O verificador copia os endereços retornados ao Java e rejeita lista vazia,
duplicação, valor nulo, loopback, IPv6 textual ou qualquer IP fora do VIP.
Em caso válido, faz um handshake por IP distinto, conectando ao destino numérico,
com SNI do registry, validação do certificado/hostname, TLS 1.2/1.3 e timeouts
de socket. Não faz HTTP, segue redirects, chama SDK/ADC, executa Docker ou repete
tentativa falha. Exceções viram códigos sanitizados; nenhum certificado/resposta
bruta é emitido. Fundamento: [SSLParameters Java 25](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/javax/net/ssl/SSLParameters.html).

**Não é correção do Docker ou aprovação operacional.** Resolve pelo Java,
não pelo Go do daemon, e não há atomicidade com uma resolução posterior do pull.
O controle privado de DNS/egress, seus snapshots efetivos e IAM continuam
necessários. O teste TLS também não valida API, redirects ou fluxo de autenticação
do registry. Nenhuma consulta DNS ou handshake real foi executado nesta entrega.

## 2. Integração fail-closed, sem modificar o pacote anterior

`guarded-launcher.mjs` compõe o gerador anterior sem sobrescrevê-lo. A sequência
proposta é:

`intent persistente → hashes → timeout/Java → pull único → probe/serial`

Antes do helper/pull, exige checksum de inventário do runtime e das quatro
classes de produção, depois verifica o inventário completo e executa Java com
`-Xms16m -Xmx32m`. Deadline externo de 12 segundos, SIGTERM e SIGKILL após
2 segundos pelo `timeout` nativo; isso também limita DNS que não seja interrompível
dentro do JRE. Variáveis de injeção de opções Java são removidas da unidade.
Ausência, hash inválido ou saída não zero interrompem a sequência; não há prefixo
para ignorar o erro. Marcador anterior ao guard preserva anti-repetição.

O gerador exige bindings explícitos, rejeita placeholders zerados, classes
extras e caminhos arbitrários. O hash informado **não é autorização** nem prova
de inventário seguro: o preparo futuro deve conferir paths, links, permissões,
truststore e dependências nativas antes de produzir o manifesto aprovado.
Classes de teste não fazem parte da instalação proposta.

Runtime/classes ausentes no COS impedem pull. Nenhum pacote executável cloud foi
publicado ou cloud-config operacional foi gerado com hash fictício. Os hashes
de exemplo dos testes são sintéticos. O leitor/core anterior reconhece terminal
de falha mesmo antes de `BEGIN`, sem inventar sucesso ou persistir conteúdo serial
arbitrário. Vínculo ao novo hash de metadata dependerá de preparação autorizada.

## 3. Evidência de testes locais

- TDD: compilação falhou com guard ausente; tests do gerador falharam antes do módulo.
- 50 verificações sintéticas Java passaram no JDK 23 local e no Java 25 da imagem Linux/amd64 existente. São as mesmas fixtures em dois runtimes, não 100 cenários independentes.
- Seis checks Linux passaram: fixtures, CLI sem modo, argumentos proibidos, inventário ausente, classe adulterada e timeout de um filho sintético.
- A suíte Node anterior mais cinco testes de integração passou: 39 testes, zero failures/skips. Transportes falsos e JDK local; não prova systemd/COS.

Imagem usada por digest:
`sha256:cf73e5c4241a96a095dcec030296dfea3269a3c50d6152466a09802fe17b0c02`.
Containers temporários read-only, usuário 1000, sem rede, capacidades ou mount de
credencial; `--pull=never`. Removidos ao encerrar; imagem/cache existentes
preservados. Testes nativos usaram Ubuntu da imagem, **não o host COS**.

Primeiro runner assumia caminho Homebrew de Docker inexistente; falhou sem
iniciar container. Tentativa preservada, caminho instalado `/usr/local/bin/docker`
conferido e execução corrigida em seguida. Não tratar falha de transporte como
falha do Java/DNS/TLS. Pequenos arquivos de build/teste ficam ignorados.

## 4. Runtime necessário e próxima aprovação

Inventário público do COS fixado foi novamente conferido pelo mesmo hash.
Publica coreutils, curl e systemd, mas as seleções consultadas não identificaram
JRE/Node: `node-problem-detector` **não é Node.js**. Não é atestação de todo path
do SO; tampouco licença para executar código próprio em Python/shell.
Fonte: [metadados do build](https://storage.googleapis.com/cos-tools/19216.739.5/cos-package-info.json).

Para manter implementação Java, próximo preparo requer um JRE Linux dedicado,
reaproveitando o da imagem já presente, sem baixar nova base. Tamanho lógico
medido, ainda sem cópia: **199.845.113 bytes (aproximadamente 191 MiB)**.
Disco local observado com 27 GiB livres. Propor limite de 512 MiB adicionais
para pacote/intermediários; não mexer em caches ou arquivos de performance.

**Preparação/cópia do runtime aguarda confirmação.** Não foi instalado no macOS,
extraído para novo diretório ou enviado à cloud. Compatibilidade com COS,
dependências/truststore, links seguros e scan atualizado continuam pendentes;
não chamar cópia do JRE de runtime certificado. Instalação no host, upload,
API/zona DNS, recursos e custo VM terão confirmação própria posterior.

## 5. Hashes da parcela

| Artefato privado          | SHA-256                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `PrePullGuard.java`       | `f8bf8985afbe55e4efe1dc36baea5bc481847bf70e054fe193d3e2d05cb29a0a` |
| `PrePullGuardChecks.java` | `a333f6a8adf28d1c89b50253efeb139878a7757d4049651776fee1e1255641a9` |
| Gerador com guard         | `1aeed3a310ad32013b418008c36d58b4dea585015eaecc542738b87b08369b51` |
| Testes de integração      | `3a57aa0dbad737f2225db8a2b0ef9932cb667bb1cc3aa56a386dbe686bca8c3b` |
| Recibo Linux              | `535277fb40faf358b3402ffa240a99c1f903a736e18cb1c5ec4418b898bcbc25` |

Gateway/worker/rendering/layout permanecem desabilitados. Fontes técnicos,
capturas anteriores, pacotes locais anteriores e histórico SDD serão preservados;
nenhuma promoção da 020/021 decorre deste teste de pré-condição.

Fechamento às **13:26 de Brasília**: 419 caminhos/bytes técnicos iguais ao hash
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`;
leitor e cloud-config/unidade anteriores intactos. 34 links locais nos três
documentos e sintaxe dos scripts conferidos; Prettier direcionado e diff-check
do gateway aprovados. Preparo privado menor que 64 KiB, sem extrair o JRE ou
gerar cache grande. Recibo `verification.json`:
`5d3ad36977a0b1ce3e25c6f1a13c61e9678df564619f8ce2e84c075cd0a61ce9`.

Global conserva o EOF externo em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`.
Maven/web/mobile/SDD não reexecutados ou redatados por esse tooling/documentação;
este fechamento não conclui a operação cloud ou a feature de renderização.
