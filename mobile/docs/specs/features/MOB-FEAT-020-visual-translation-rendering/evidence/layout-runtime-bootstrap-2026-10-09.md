# Bootstrap ONNX nos runtimes Linux preparados — 2026-10-09 UTC

Parcela preparatória de TASK-002/007/008, não admissão de memória ou layout
cloud. 020 permanece `in-progress/open`, verdict `changes-requested`; 021
`approved/blocked`. Nenhum runtime/default/migration/codec foi alterado.
Somente probe Java exclusivo dos testes e governança. Performance mobile N/A.

## Preparação reproduzível

[Plano anterior à prova](../../../../../../api/apps/translation-gateway/docs/layout-runtime-resources.md).
Modelo local conferido com o pin publicado
`065744e91c0594ad8663aa8b870ce3fb27222942eded5a3cc388ce23421bd195`.
SDK ONNX Java 1.24.2 cacheado, SHA-256
`f429cc9d64b3bcef00bfac921a6aa231b3c280bee2e55c27f2563035b1a44104`.
Nenhum download/install, imagem privada, ADC ou provider foi usado.

Bibliotecas extraídas do JAR cacheado, sem modificar seus bytes:

| Plataforma | Biblioteca              | SHA-256                                                            |
| ---------- | ----------------------- | ------------------------------------------------------------------ |
| ARM64      | libonnxruntime.so       | `e18fe095919d8613ead3a31ff78212bde4fad929418a9b48f49d61c829ed5c82` |
| ARM64      | libonnxruntime4j_jni.so | `5b7778d009485672e9c24a60a33def1f4fbf50c95c11e08dc212707f3c936b60` |
| x86_64     | libonnxruntime.so       | `ffc84d48e845cf0b562ba4ea5ca32aaafc0d4069019fef4f63095b307d0270ad` |
| x86_64     | libonnxruntime4j_jni.so | `3945d692879bc54eb731b217a7c967b9283298f918b8cafc703d2a5a6c522a62` |

Mesmos Java 23 Linux pinados das provas do codec: ARM64 digest `88593498…7c87`
e x86_64 `55d6ecee…190a`. Docker `--pull=never`, network none, usuário não root,
capabilities removidas, filesystem/inputs readonly, PIDs/CPU finitos.
Solicitados cgroup 1 GiB sem swap e heap 128 MiB; não há medição/admissão desses
recursos nesta prova. SDK usa native.path explícito, bibliotecas readonly e
modelo readonly; temporário privado sem execução.

Compilar `LayoutRuntimeCompatibilityProbe` contra classes do gateway e SDK
cacheado, depois executar nas duas imagens. Somente fase/categoria/duração
são emitidas; não imprimir throwable, mensagem bruta, model path ou chave.
Dois testes puros conferem categorias, inclusive causa aninhada e mensagem
sensível. Comandos/artefatos locais sanitizados ficam na pasta ignorada da rodada.

## Resultado observado e inferência separada

Nos dois alvos: processo de diagnóstico exit 0, mas `outcome=failed`,
`phase=runtime-load`, `failure=missing-libstdcxx`, `providerMode=none`,
`imageCount=0`. Exit 0 significa que o diagnóstico foi gravado, não que ONNX
funcionou. Sessão/inferência/worker com modelo residente não foram executados.

Fato: as imagens preparadas não forneceram `libstdc++.so.6` à carga JNI.
Inspeção binária encontrou referências a libc.so.6, ld-linux e versões GLIBC
nas bibliotecas do SDK; isso é pista de compatibilidade, não prova de que apenas
adicionar libstdc++ resolveria o stack. Não confundir com licença/hash inválido,
qualidade do detector, benchmark ausente ou memória insuficiente.

Fonte/testes/config gateway: 371 arquivos, SHA-256
`d740e0aaa283fdf9a6ee8220d62691f327b6b4e87c5c475a8e28d3d624708a37`.
JAR de runtime continua `954b42c29bf71ec316e29d59c87e133d6b2b7541fbf69564a5eb77a234a091cd`:
nenhuma produção mudou. Provas de rendering anteriores não são execuções novas
com ONNX. Checksum SDD é separado do técnico.

## Decisão pendente e continuidade

Foi apresentada para aprovação a preparação local de Java 23/glibc e build
oficial libwebp compatível, sem C próprio, cloud ou providers. Não executar essa
troca/preparação de dependências silenciosamente. Até a decisão/preparação e
nova prova, o perfil de layout residente permanece sem evidência válida.
SDKs com transporte falso e pipeline integrado exigem provas distintas.

Gateway, worker cloud e layout continuam desabilitados por padrão. Orçamento
agregado, qualidade e operação seguem abertos; não promover 020 ou abrir 021.
Gates normais aprovados só confirmam regressões, não apagam esta lacuna.
