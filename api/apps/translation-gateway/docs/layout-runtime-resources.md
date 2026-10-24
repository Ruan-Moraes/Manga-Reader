# Layout residente no worker — preparação offline, 2026-10-09

Parcela de 020/TASK-002/007/008: verificar compatibilidade antes de atribuir
memória de ONNX/layout ao pipeline. Não autoriza novo modelo/runtime, download,
imagem privada, ADC, chamada Vision/tradução, cloud ou mudança de defaults.

Primeira prova é bootstrap separado, exclusivo dos testes: modelo/SDK pinados,
mesmos runtimes Java 23 Linux já preparados, network none, root/inputs readonly,
CPU/memória/PIDs finitos. Conferir o modelo, carregar JNI e criar a sessão real.
Saída inclui somente fase, categoria de erro allowlisted e duração; nenhum path,
throwable bruto, texto, objeto de job ou credencial.

O JAR ONNX 1.24.2 local tem SHA-256
`f429cc9d64b3bcef00bfac921a6aa231b3c280bee2e55c27f2563035b1a44104`;
modelo mantém o pin publicado. Inspeção binária encontrou referências glibc nas
bibliotecas Linux. A hipótese é incompatibilidade com os runtimes Alpine/musl
pinados para o codec; bootstrap deve confirmá-la ou refutá-la antes do profiling.

Se o bootstrap falhar, registrar lacuna funcional de plataforma, não ganho de
memória ou modelo validado. Não trocar tecnologia/dependência/imagem silenciosamente.
Se passar, a próxima prova integra layout real ao worker com mídia sintética,
storage/SQL locais e providers falsos; SDKs reais com transporte falso terão
parcela distinta. Bootstrap sozinho não mede o pipeline nem admite RAM cloud.

## Worker combinado local — 2026-10-10

`NativeRenderingWorkerImageLinuxTest#packagedWorkerKeepsRealLayoutResidentWithLoopbackSdks`
é a seleção opt-in do worker com layout real, clients oficiais OCR/tradução
contra gRPC local e renderer real nas imagens glibc candidatas. Requer as mesmas
propriedades explícitas de IDs/pins/socket/decoder da
[imagem nativa](rendering-native-image.md) e
`renderer.native.image.layout.model=<path-absoluto-do-modelo-cacheado>`.
Não baixa, escolhe amostra real, inicializa ADC ou chama Google.

O harness verifica o modelo e extrai somente dois arquivos JNI do SDK já cacheado,
com pins por arquitetura e limite de 64 MiB por arquivo/JAR. Monta bibliotecas
readonly e configura `onnxruntime.native.path` antes da criação do contexto.
O temporário permanece `noexec`; o modelo é readonly. Isso é preparação exclusiva
do teste, não distribuição operacional de JNI/modelo pela imagem candidata.

Perfil worker real, PostgreSQL 17 privado/V1–V9, storage local, MockMvc com filtros,
uma CPU, PIDs 64, rootfs readonly, swap adicional zero, cgroup diagnóstico 8 GiB,
AS pai/filha 3 GiB e heap atual. Quatro páginas sequenciais: saída total máxima,
região máxima pintada, vazio e controle pequeno com inferência obrigatória.
Verifica estado e vínculos/hash do layout separado; ele não altera o manifesto
OCR ou os pixels do render. Reentrega não aumenta as quatro/três RPCs dos fakes.

Resultados e limitações na
[evidência da imagem](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-image-2026-10-10.md).
Uma rodada por alvo não é benchmark estatístico, admissão cloud, qualidade
do detector ou prova de todas as combinações de formato/idioma/falha.
