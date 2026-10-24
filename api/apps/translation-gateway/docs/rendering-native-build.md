# Preparação local libwebp — plano, 2026-10-04

Parcela investigativa de TASK-002/007/008 e AC-006. User autorizou build do
source oficial 1.6.0 com compilador/headers somente em container de teste.
Não instalar toolchain no host nem escrever C próprio; integração futura Java.
Nenhum codec/bean/default de produção será substituído por esta preparação.

## Escopo e isolamento

Reutilizar archive oficial já adquirido, SHA-256
`e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564`.
Reutilizar imagem Temurin ARM64 fixada pelo digest da prova Linux, sem pull.
Container exclusivo: uma CPU, 1 GiB total/sem swap adicional, 64 PIDs,
no-new-privileges/cap-drop ALL. Montar apenas archive read-only e diretório
novo ignorado em `.local/rendering-linux/`; nunca workspace, imagem, ADC ou HOME.

Rede temporária somente para apk/repositórios oficiais da imagem: gcc,
musl-dev e make. Registrar versões resolvidas e pacotes transitivos. Depois
desconectar o container da rede antes de configure/build/test. Root filesystem
gravável permite instalação somente ali; não configura ambiente operacional.
Remove-se apenas o container com nome exclusivo, mantendo os artefatos locais.

## Build e verificação

Usar configure/Makefiles upstream sem alterações, não script próprio ou JNI
customizado. Release contém configure; autogen/SWIG/Python não são necessários.
Build shared, sem static, mux/demux/extras e formatos externos PNG/JPEG/GIF/TIFF/
GL/SDL. Registrar opções reais e falhar se houver incompatibilidade, sem trocar
versão/tecnologia silenciosamente. Build de src/sharpyuv; instalação de headers
e libs somente no prefix local próprio. Nenhuma chamada paga ou mídia do piloto.

Verificar ELF ARM64, dependências, exports de versão/encode/decode, hashes,
COPYING/PATENTS upstream e inventory de pacotes. Preservar baseline de CLI.
Smoke de versão poderá usar Java 23 FFM exclusivo de teste em container sem
rede; não prova ABI de structs ou ausência de cópias no encoder. Validação de
buffers/ownership/alpha/exact/memória será incremento distinto antes de qualquer
troca. Não alegar distribuição de produção, assinatura verificada ou AC completo.

O orçamento de 1 GiB do worker e cgroup read-only permanecem findings abertos;
build não os resolve. Falhas/limites serão registrados em evidência própria.

## Resultado da preparação

[Evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-build-2026-10-04.md):
build/install concluídos, 367 arquivos upstream intactos, hashes/ELF/exports e
versão 1.6.0 via Java FFM conferidos offline. Controle de SHA adulterado falhou
antes de load. Artefatos/manifesto locais em `.local/rendering-linux/native-build.vLY64G/`;
container de toolchain removido. Aviso no configure e RUNPATH local preservados
como limites, sem editar C ou declarar codec de produção integrado.
