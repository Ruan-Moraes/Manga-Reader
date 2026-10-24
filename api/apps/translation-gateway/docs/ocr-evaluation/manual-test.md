# Teste manual reproduzível do worker

O executor usa uma imagem do [pacote local](local-samples.md), PostgreSQL 17
temporário e o controller real do perfil `worker` por MockMvc, com filtros de
segurança ativos. Não abre servidor HTTP, não depende da Core e não usa o banco
configurado no ambiente. Nenhum novo endpoint, migration ou modo de produção.

## Primeira rodada — sem Google Cloud

Requisitos: Node 22, Java 23, Maven Wrapper com dependências disponíveis e Docker
local funcionando. Em modo offline o executor usa Maven `-o`: dependências precisam
estar disponíveis, sem instalação implícita. Testcontainers ainda precisa da imagem
PostgreSQL 17 disponível localmente e pode tentar obter imagens técnicas ausentes;
prepare-as explicitamente. Não há acesso Google nem download automático de amostras.

Na raiz do repositório:

```bash
node api/apps/translation-gateway/scripts/ocr-samples.mjs verify
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs run --mode offline --run-id pt-p01-teste-01
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs report --run-id pt-p01-teste-01
```

A amostra padrão é `pt-ep01-p01`. Para outra imagem já admitida, informar
`--sample ja-ep01-p01`, por exemplo. Modo e ID da rodada são obrigatórios.
O ID aceita letras minúsculas, números e hífens, com até 64 caracteres.

O catálogo também admite `--sample zh-hant-read-p03` e
`--sample zh-hant-anansi-p04`: PNGs derivados, com licença/atribuição por item.
O harness revalida o MIME real contra o declarado antes de iniciar o adapter.
Os relatórios OCR e de layout mantêm a origem, licença e indicação da derivação;
não atribuem Pepper&Carrot/CC BY 4.0 aos livros. Uma simulação desses livros não
comprova reconhecimento de chinês tradicional ou qualidade de balões.

Para a capa histórica CC0 já restaurada localmente:

```bash
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs run --sample ja-tokyo-puck-1909-cover --mode offline --run-id tokyo-puck-simulacao-01
```

O relatório preserva o crédito e o aviso de orientação mista/conteúdo multilíngue.
`ja` é um hint técnico, não confirmação do idioma de todas as regiões. Nenhuma
direção de layout é inferida. Simular essa página não valida OCR vertical nem
autoriza uma chamada real. Não reutilizar IDs de rodadas já existentes.

Abra `.local/ocr-samples/runs/pt-p01-teste-01/report.html`. O banner
**SIMULAÇÃO — não reconheceu o texto da imagem** é permanente nas rodadas offline:
o gRPC falso devolve texto sintético, não uma transcrição. Isso verifica encadeamento,
geometria, persistência e exportação; não verifica qualidade OCR.

## Comparar sem nova chamada

```bash
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs run --mode offline --run-id pt-p01-teste-02
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs report --run-id pt-p01-teste-02 --compare pt-p01-teste-01
```

O HTML comparativo fica na segunda rodada. `report` só lê arquivos locais,
revalida amostra, manifesto e hash da captura bruta nas rodadas novas e gera HTML;
não inicia Java, Docker, ADC ou provider.
Só compara mesmo ID de amostra e hash. Preserva a ordem de cada manifesto; IDs
de regiões são diferentes por job e não demonstram correspondência entre rodadas.
Não há tradução automática, CER ou nota de qualidade. A tradução editorial
portuguesa da galeria continua distinta de qualquer resultado do Toonlira.

## Artefatos e interpretação

Cada diretório de rodada é reservado atomicamente, nunca reutilizado:

- `request.json`: amostra, modo, hash, licença/créditos, início, revisão Git,
  indicação de árvore alterada, Node e hash dos POMs;
- `invocation.lock`: marca durável de início, que impede repetição pelo harness;
- `manifest.json`: bytes originais do manifesto `1.0`, somente após exportação válida;
- `vision-response.pb`: resposta protobuf `BatchAnnotateImagesResponse` serializada
  antes do mapper, limitada a 4 MiB; no modo offline contém somente a fixture sintética;
- `result.json`: estados, hashes, datas da chamada, código gRPC sanitizado, projeto
  de quota, identidade alvo, versões e limpeza pendente; nunca tokens ou caminho ADC;
- `report.html` e `compare-<id>.html`: imagens, quadriláteros, ordem e texto escapado;
- `notes.md`: observações editadas manualmente em arquivo, sem sobrescrita pelo gerador;
- `object-N.json`: diário privado das chaves tentadas, para recuperação de órfãos.

Todos ficam ignorados pelo Git, sem expiração local automática para este conjunto
licenciado. Não versionar resultados/textos. A imagem original reutilizável nunca
é removida: o worker recebe uma cópia. Artefatos temporários do processamento são
removidos após exportação; a retenção de mídia de produção não muda.

HTTP `204` sozinho não significa sucesso. O executor exige `OCR=SUCCEEDED`,
job `TRANSLATING`, hash correspondente ao banco, manifesto válido e captura bruta
íntegra. A captura é a mensagem protobuf decodificada, não um dump de tráfego ou
headers de autenticação. Pode conter texto e erros do provider: tratá-la como
conteúdo privado, nunca imprimir em logs. Arquivos são criados com modo `0600`,
sem sobrescrita, dentro da rodada `0700`. `TRANSLATING`
é apenas o estado seguinte do pipeline: não houve tradução. Para cumprir o CHECK
de idiomas diferentes, a fixture pt-BR usa destino técnico `en`; demais fontes
usam `pt-BR`. O disclosure de fixture não é aprovação legal nem capability pública.

Resultado ausente aparece como `interrupted`; manifesto corrompido aparece como
`evaluation-invalid-artifact`, sem mostrar texto como saída confiável. Regenerar
HTML não altera os JSONs de evidência. Falhas não são retomadas automaticamente.
Rodadas antigas (`request.version=1`) permanecem legíveis, mas não comprovam
captura bruta; as novas usam versão `2`, sem mudar o manifesto do produto `1.0`.

## Execução real futura — opt-in separado

**Não executada nesta entrega.** Antes de usar `vision`, obter autorização explícita
para processamento remoto/custo e conferir:

1. Projeto existente com Vision disponível e cobrança autorizada.
2. ADC de avaliação isolada, do tipo `impersonated_service_account`, com fonte
   `authorized_user` e sem delegates ou chave privada. Informar arquivo absoluto
   fora do repositório (`0600`, diretório pai `0700`, sem symlink) e conta de serviço
   alvo no mesmo projeto. O executor valida o destino e não usa descoberta ADC,
   endpoints alternativos do JSON ou a ADC pessoal como fallback.
3. Bucket de testes dedicado, existente nos EUA, com Public Access Prevention
   `enforced`, acesso uniforme, acesso privado e permissão para consultar seus metadados, criar,
   ler e remover os objetos da rodada. O preflight somente consulta; não altera IAM.
4. Direito vigente de processar a imagem e política aplicável do provider.

Somente após esses gates, substituir os valores simbólicos e executar manualmente:

```bash
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs run --mode vision --run-id pt-p01-real-01 --project SEU_PROJETO --bucket SEU_BUCKET_PRIVADO --credentials-file /DIRETORIO_PRIVADO/application_default_credentials.json --service-account CONTA@SEU_PROJETO.iam.gserviceaccount.com --confirm-paid-call
```

O consentimento é por invocação, não configuração persistente. O harness usa somente
a credencial explícita, sem reescrever arquivos ADC. O projeto informado é também
o projeto de quota explícito nos clientes Storage/Vision e na credencial impersonada;
não depende da presença de `quota_project_id` no arquivo. Variáveis cloud e overrides
JVM herdados são removidos do ambiente do harness. No modo offline, opções cloud
são recusadas e nenhuma credencial é carregada.

O caminho real usa GCS e o adapter regional existente (`us-vision.googleapis.com:443`), uma imagem,
deadline de 60 segundos e sem retry OCR. O resultado pode variar entre chamadas
mesmo sem mudanças locais: serviço gerenciado não garante determinismo de qualidade.
Não há fallback para simulação. Nenhum Cloud Tasks, deploy ou Terraform é executado.
O harness é exclusivo de testes; a suíte Maven padrão não seleciona `ManualOcrEvaluationIT`.

## Falhas e recuperação

- ID já utilizado: abrir o relatório existente; escolher outro ID só para uma
  nova rodada intencional, com nova confirmação em modo real.
- Falta de Docker/Java/dependências: corrigir o ambiente; a rodada interrompida
  permanece registrada. Não apagar `invocation.lock` para tentar novamente.
- Timeout/retorno ambíguo: não repetir automaticamente; pode ter havido cobrança.
  Sem mensagem recebida, a captura indica `not-received`; não inventar arquivo bruto.
- Captura bruta indisponível: `evaluation-raw-capture-unavailable` impede apresentar
  a rodada como bem-sucedida, mesmo se o worker concluir. Arquivo preexistente é
  preservado e nenhuma segunda chamada é feita. Metadados registram `capture-failed`.
- `cleanupPending=true` ou interrupção: custodiante consulta os `object-N.json`
  locais e verifica **somente essas chaves** no bucket indicado antes da remoção.
  Não limpar prefixos compartilhados nem executar o cleanup global do gateway.
- Não habilitar logs HTTP/SQL/SDK de depuração durante a execução real. A CLI não
  imprime saída bruta do Maven; falhas sanitizadas ficam no relatório. Erro de
  inicialização anterior à criação de resultado é registrado como interrupção.

Arquivos desconhecidos, amostras adulteradas, symlinks e resultados conflitantes
são preservados e recusados. Não há `--force`, resume nem reinstalação implícita.

## Validação automatizada

```bash
node --test api/apps/translation-gateway/scripts/ocr-evaluation.test.mjs
cd api
./mvnw -pl apps/translation-gateway -am test -Dtest=EvaluationCredentialsTest,EvaluationVisionCaptureTest,OcrEvaluationHarnessTest -Dsurefire.failIfNoSpecifiedTests=false
```

O harness automatizado usa JPEG sintético e gRPC falso, sem depender das imagens
locais para o CI. Cobrem-se controller com filtros, V1–V2, integridade, reentrega,
concorrência, cancelamento, timeout, storage, rollback e confirmação perdida.
Fixtures de credencial são fictícias: validam quota/configuração sem refresh,
descoberta ADC ou autenticação. Captura é testada antes do mapper, inclusive em
resposta inválida, falha de escrita, limite excedido e tentativa de sobrescrita.
A preparação não conclui TASK-004/005 ou o benchmark de 18 referências revisadas.
