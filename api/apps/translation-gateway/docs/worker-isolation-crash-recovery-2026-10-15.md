# Recuperação após interrupção e staging parcial — 2026-10-15

## Resultado e escopo

Continuação do [registro progressivo](worker-isolation-progressive-recovery-2026-10-15.md).
Novo journal local com publicação atômica e lock do sistema operacional, além da
ligação explícita entre retirada parcial Compute e staging. Validado localmente
com Java instalado, processos interrompidos por SIGKILL e API falsa. **Não houve
consulta ou mutação Google, uso de credenciais, instalação, envio de arquivos,
Vision, tradução ou nova reserva financeira nesta parcela.**

Tooling privado ignorado: `.local/worker-isolation/mount-crash.KC1VeM/`.
Não altera fontes do aplicativo, migrations, defaults, performance, status SDD
ou recibos históricos. A 020 continua `in-progress/open`; a 021 segue bloqueada.

## Journal transacional local

O diretório antigo `.transition-lock` não é apagado nem considerado expirado por
PID/tempo. Não há migração silenciosa dos journals anteriores. O contrato novo
usa diretório exclusivo `mount-cas-XXXXXX`, com modo 0700, e um arquivo
`.journal.lock` persistente 0600 que **nunca é substituído ou removido**.

O helper Java executa toda a leitura/CAS/publicação sob `FileChannel.tryLock`.
Não deixa o Java segurando o lock enquanto outro processo escreve. O Node aplica
somente regras locais sobre uma fotografia; o helper compara seu hash antes de
publicar. Conflito de fotografia refaz somente a transação local, jamais POST ou
DELETE cloud. Contenção e duração do helper são limitadas; erro é sanitizado.

`state.json` contém os mesmos vínculos, intenções e observações de operações,
agora como fotografia integral limitada a 128 KiB. A nova fotografia é escrita
em arquivo exclusivo 0600, sincronizada, renomeada atomicamente no mesmo
diretório e seguida de sincronização do diretório **antes** da confirmação.
Uma interrupção preserva a fotografia anterior ou a nova, não um JSON parcial
publicado. Rascunhos `.pending-*` não são adotados, apagados ou usados como
permissão de envio. Restos de interrupção ficam para inspeção local explícita;
sucesso normal não deixa rascunhos.

Casos verificados: concorrência concede uma única intenção; seal e claim são
serializáveis; reabertura não repete envio; operação em voo pode ser observada
após seal. Plano diferente, corrupção, symlink, hardlink do lock, permissões
abertas e lock legado falham conservadoramente. Uma intenção publicada sem
confirmação ainda é ambígua: ausência de operação **não** autoriza reenvio.

Java vem do Corretto 23.0.2 já instalado; testes compilam em diretórios temporários
próprios e os removem ao terminar. Não é dependência do worker de produção, não
busca Maven/SDK nem inicia shell. O helper é executado com ambiente vazio, sem
injeção de opções JVM por variáveis de ambiente.

Segundo o contrato de [FileLock](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/nio/channels/FileLock.html),
a terminação da JVM libera o lock. Locks são tratados como cooperativos: não
protegem contra um operador do mesmo usuário alterando arquivos deliberadamente.
Foram testados no filesystem local deste Mac; não se presume suporte equivalente
em volume remoto, nem resistência a falha física de disco. Ausência de suporte a
rename atômico/fsync ou integridade desconhecida interrompe a operação.

## Interrupções testadas, não falhas cloud reais

O teste encerra um holder real com SIGKILL e readquire o lock sem excluir seu
arquivo. Dois outros testes usam os **mesmos métodos Java de preparação e
publicação**: interrompem uma fixture antes do rename e depois da publicação,
antes da confirmação ao chamador. No primeiro caso, o estado anterior permanece;
no segundo, o estado publicado é recuperado e não concede nova tentativa.

Essas fixtures são exclusivas dos testes. Completam os testes de fotografias
incompletas e confirmação perdida; não simulam queda de energia, não provam
comportamento COS e não são uma interrupção observada de operação Google real.

## Staging vinculado ao escopo parcial

O novo plano `mount-partial-staging-2` usa `progressivePlanSha256`, janela de
aquisição e gerações/metagerações recebidas do Storage. **Não fabrica oito IDs**
nem reutiliza `computePlanSha256` do contrato completo anterior. Valida bucket,
objeto, hash/tamanho do archive, projeto e data de criação dentro da janela
explícita de no máximo 30 minutos. O journal de Storage tem vínculo próprio;
composição rejeita journals de outro plano antes de buscar credencial.

O ciclo HTTP foi derivado mecanicamente do adapter anterior, preservando
precondições e limites; só o contrato/vínculo/autorização foram versionados.
A composição primeiro fecha novas criações e resolve todas as tentativas Compute.
Se houver operação pendente, ambígua ou recurso sem ownership, **preserva a fonte**.
Somente após retirada confirmada do Compute, revalida os oito nomes por GET antes
de cada efeito Storage; o journal deve continuar fechado e estável.

No Storage: compara geração pinada e latest, exclui só a geração própria com
precondições, confirma ausência, exige listagem vazia incluindo versões e faz
DELETE condicional do bucket próprio. Resposta perdida usa ausência posterior
sem repetir DELETE. Objeto estranho, troca de geração ou tentativa já gasta com
recurso presente interrompem a limpeza; não existe varredura destrutiva ampla.
Mantida a limitação da API: exclusão do bucket condiciona metageração, não uma
geração de objeto; exige ausência de operadores concorrentes alterando o bucket.

Testes usam token fictício e fetch injetado; **nenhum objeto ou bucket real foi
removido nesta parcela**. `physicalDeletionVerified=false` e
`operationalApproved=false`; ausência ativa não equivale a expurgo físico de
versões retidas por soft delete.

## Reprodução e rastreabilidade

```bash
node --test .local/worker-isolation/mount-crash.KC1VeM/journal.test.mjs .local/worker-isolation/mount-crash.KC1VeM/partial-storage.test.mjs
```

Testes escritos antes dos módulos, com falha inicial de importação registrada na
execução. A compilação usa somente o Java já instalado; não executar instalação
para reproduzir sem uma aprovação específica. Artefatos de código/fixtures são
pequenos; archive, JRE, RAW e cache Docker não foram copiados. Classes temporárias
próprias foram removidas; nenhuma evidência ou arquivo de performance apagado.

| Artefato privado      | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `JournalTxn.java`     | `706e65f1001d55f4f70d5e7f3f2bc07655047b3409a89eb0a7ac0f6d8634c8a7` |
| `journal.mjs`         | `818b6b238d600e1a5481402d04a722cfa963b90e8c6ee79e337432bcbc790e5c` |
| `partial-storage.mjs` | `208fd830e366aabbb43baa330423a5eba625f1906b4039e42389c0938a6348bc` |

O fechamento em `verification.json` confere os fontes auditados do gateway,
recibos anteriores, ledger e suíte conjunta. Não renova gates Maven/web/mobile/SDD
sem mudanças nessas superfícies. O finding global de EOF do landing page permanece
fora do escopo, sem correção automática.

## Próxima barreira operacional

Recuperação do mutex e conexão parcial ao staging estão implementadas e testadas
**localmente**. Ainda faltam requests de criação semanticamente aprovados,
mutadores Compute HTTP ligados ao journal, revisão das condições nativas COS e
cotação/admissão financeira completa antes de uma VM real. Sem isso, a composição
não é um executor cloud aprovado. Não há execução do worker nem aprovação de
isolamento ou do gate 020.

Ledger conserva duas reservas históricas e nenhum novo slot foi consumido.
O limite total autorizado continua US$ 5; envelope anterior de US$ 0,66 permanece
provisório, não é fatura, cotação completa ou teto imposto pelo provedor.

## Fechamento observado

Suíte conjunta: **422 testes aprovados**, zero falhas, cancelamentos ou skips;
29 casos novos. Três interrupções por SIGKILL de processos locais são distintas
das operações cloud inteiramente falsas desta parcela. Conferidos 137 links
relativos, sintaxe JavaScript, compilação Java, formatação direcionada e
diff-check dos documentos alterados. O diff-check global ainda aponta somente
o finding alheio em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`.

Fotografia técnica do gateway intacta: 419 paths, SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não cobre Dockerfile, mobile, documentação, tooling privado ou aprovação do host.
Recibos anteriores e ledger de duas reservas também conferidos sem alterações.
Diretório privado desta parcela ocupa aproximadamente 168 KiB; classes de teste
próprias foram removidas, sem apagar evidência ou tocar na auditoria de performance.

Recibo `verification.json`:
`885be0d91968de9c4c04d9e567d8c07b9244a69acc19a0a1c3605ce25dd819d8`.
Este fechamento foi acrescentado após o recibo, com nova conferência direcionada
de formatação/diff; a fotografia anterior não foi sobrescrita.
