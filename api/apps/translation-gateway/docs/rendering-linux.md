# Renderer Linux local — 2026-10-04

Parcela experimental de TASK-002/007 da MOB-FEAT-020. Este plano antecede o
harness de teste; não altera o renderer de produção, schema, worker ou defaults.

## Plano e fronteira

Usar somente o JRE 23 Alpine já utilizado pelo Dockerfile do módulo, adquirido
com autorização explícita de Ruan para preparação/testes locais. Fixar o digest
da imagem adquirida e executar com pull=never, sem rede, portas, credenciais,
capacidades Linux ou privilégios adicionais. Não montar o repositório, HOME,
ADC ou imagens do piloto: somente JAR, codecs e fixtures sintéticas por teste.

Os binários oficiais libwebp 1.6.0 Linux aarch64 foram adquiridos por HTTPS e
seus SHA-256 registrados. São ELF static-pie: execução será verificada, não
presumida pela identificação do arquivo. A assinatura foi adquirida, mas não
validada criptograficamente; licenças transitivas e empacotamento de produção
continuam abertos. Nenhum fallback de versão, arquitetura ou imagem.

Criar fixture Java exclusiva de testes, com Docker CLI local e configuração
vazia própria. Exigir endpoint unix explícito; nunca utilizar contexto remoto
ou credential helper pessoal. Criar container com nome UUID próprio, iniciar
o processo sem shell e remover somente esse container ao final, inclusive em
falhas. Falha de remoção deve reprovar o teste. Nenhum download implícito.

O original e JAR/codecs terão mounts read-only; staging sintético será o único
bind gravável, com /tmp separado em tmpfs limitado. Root filesystem read-only,
usuário do staging, no-new-privileges, cap-drop ALL, 1 CPU, 1 GiB de memória
(swap sem acréscimo), 64 PIDs. Heap da filha de 512 MiB. Esses são parâmetros
do teste local, não um orçamento de produção aprovado. O staging bind não tem
quota de disco: não alegar limite agregado ou contenção integral do chamador.

Testar argumentos/validação antes da fixture e depois executar o JAR Boot real
com RenderChildMain, PropertiesLauncher fixado e protocolo interno existente.
Fixtures: sete destinos, página PNG vazia e WebP vazio. Conferir original
intacto, regiões/texto/ordem/fallback, hash/MIME/dimensões e decodificação real.
Pixel equivalence da página vazia é exigida; identidade raster entre macOS e
Linux com texto não é presumida. Não é avaliação linguística ou carga máxima.

## Pendências de produção

Esta prova não admite uma distribuição final: faltam assinatura/proveniência
independente, inventário de licenças transitivas, empacotamento reproduzível,
contenção atômica do processo nativo no worker, memória/disco/deadline integral,
profiling no limite e revisão visual. Não adicionar Docker ao runtime do worker.
020 permanece in-progress/open; 021 blocked; todos os defaults disabled.

## Reprodução explícita

Pré-requisitos: Docker local ativo, imagem/digest e binários já adquiridos e
conferidos explicitamente. O teste não baixa dependências nem imagens. Somente
Linux ARM64 é coberto; não substituir ferramentas ou base por conta própria.
Rodar a partir de api:

```bash
./mvnw -o -q -pl apps/translation-gateway -am package -DskipTests
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=LinuxRenderContainerFixtureTest,RenderLinuxNativeTest \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Drenderer.linux.enabled=true \
  -Drenderer.linux.docker.path=/caminho/local/docker \
  -Drenderer.linux.docker.host=unix:///caminho/local/docker.sock \
  -Drenderer.linux.codec.directory=/caminho/local/libwebp-bin
```

Os caminhos são placeholders locais, não configuração de produção. O diretório
contém cwebp/dwebp com os pins da fixture/evidência. O launcher Docker aceita
atalho multicall local com target verificado: OrbStack depende de argv[0]=docker;
codec não aceita symlink. Ausência/configuração incorreta falha, sem pull ou
instalação automática. Tests comuns deixam renderer.linux.enabled ausente.

[Release oficial](https://groups.google.com/a/webmproject.org/g/webp-discuss/c/3x33RzCif0I)
e [catálogo oficial](https://downloads.webmproject.org/releases/webp/index.html)
identificam os pacotes upstream. A imagem é da
[distribuição oficial Temurin](https://github.com/adoptium/containers).
Fixar bytes adquiridos não comprova atualização de segurança ou suporte futuro.

A [evidência datada](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-linux-2026-10-04.md)
registra os resultados reais, pins e limitações, separados das provas macOS.
