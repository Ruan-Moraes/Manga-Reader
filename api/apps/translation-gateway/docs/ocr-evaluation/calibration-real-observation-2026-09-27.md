# Controles horizontal/vertical — observação real, 2026-09-27

Execução autorizada especificamente para dois controles tipográficos existentes,
com credencial de avaliação, upload privado e possível cobrança. Duas rodadas
Vision concluídas, uma por orientação, sem retry ou ampliação de escopo. Não são
imagens de mangá nem referências humanas independentes; são controles sintéticos
com resposta real do provider, sem tradução.

## Resultado observado

| Verificação                               | Horizontal              | Vertical                |
| ----------------------------------------- | ----------------------- | ----------------------- |
| Estado da etapa/job                       | SUCCEEDED / TRANSLATING | SUCCEEDED / TRANSLATING |
| Símbolos recebidos e associados           | 16 de 16                | 15 de 16                |
| Substituições nas posições associadas     | 0                       | 0                       |
| Referências ausentes                      | 0                       | 1                       |
| Associações ambíguas / geometria inválida | 0 / 0                   | 0 / 0                   |
| Sequência e ordem completas               | Sim                     | Não, falta um símbolo   |
| Ordem relativa dos símbolos retornados    | Correta                 | Correta                 |
| Quebras idênticas à referência            | Não                     | Não                     |
| Limpeza pendente segundo o executor       | Não                     | Não                     |

No vertical, falta o primeiro caractere da coluna esquerda. A ausência ocorre
na estrutura de símbolos da captura e no manifesto, não apenas na associação
geométrica. Não houve inversão dos 15 caracteres existentes. O campo
`orderExact=false` exige cobertura completa e não deve ser interpretado sozinho
como evidência de reordenação incorreta.

No horizontal, a quebra após o oitavo caractere é `EOL_SURE_SPACE`, enquanto a
referência declara `LINE_BREAK`. Ambas as orientações recebem `LINE_BREAK` ao
final, ausente na referência. No vertical, a quebra entre colunas coincide;
a cobertura incompleta também impede `breaksExact=true`. Não houve normalização
para transformar diferença em acerto.

## Fatos, hipóteses e pendências

- Validado: integração autenticada com endpoint regional US, captura real íntegra,
  manifesto/diagnóstico coerentes e persistência transacional concluída. Nenhum
  sucesso inferido apenas de HTTP 204.
- Observado: horizontal sem erro de caractere neste caso; vertical com uma omissão
  mesmo em tipografia simples. Isto limita a conclusão do controle vertical.
- Não isolado: origem interna da omissão no provider — detecção, segmentação ou
  reconhecimento. Não atribuir causalidade definitiva sem investigação.
- Pendente: generalização para mangás, furigana, imagens históricas e revisão
  linguística independente. Dois controles não constituem benchmark estatístico.

## Rastreabilidade e segurança

Artefatos completos permanecem locais e ignorados pelo Git: resposta protobuf,
manifesto original, diagnóstico, comparação, metadados e observações. Credenciais,
texto OCR e chaves de objeto não foram publicados em logs/documentação versionada.
Hashes de referência/imagem e cadeia de captura conferidos. Regeneração offline:
11 arquivos de cada rodada idênticos antes/depois, sem nova chamada. Observações
manuais foram acrescentadas posteriormente apenas em `notes.md`.

O executor validou os requisitos de privacidade/região do bucket e não registrou
limpeza pendente. Não houve alteração de cloud/IAM/billing, deploy, uploads
públicos ou defaults. Soft delete pode manter armazenamento cobrável; não foi
apurado valor faturado. A contagem remota não é auditada pelo campo `rpcCalls`
(nulo em modo real); o SDK foi configurado sem retry e cada rodada recebeu uma
resposta com gRPC OK, sem reexecução.

Verificações desta etapa: CLI real exit 0 nas duas rodadas, leitura/validação local
dos resultados, comparação com referência e regeneração determinística. Não houve
mudança de código nem repetição dos gates de implementação como novas chamadas.
Documentação: Prettier direcionado, cinco links relativos, SDD (24 testes,
specs e links) e `git diff --check` aprovados. Sem alteração de arquivos cobertos
por checksum SDD, portanto sem renovação de checksums inalterados.

Próximo passo recomendado: análise offline da omissão usando capturas existentes,
sem modificar referências ou ajustar regras especificamente pelo controle. Nova
chamada requer nova autorização. MOB-FEAT-018 permanece `in-progress`; TASK-004/005
e revisão competente do material real continuam abertas.

Procedimento: [controles pelo worker](calibration-worker.md).

## Complemento — investigação offline da omissão, 2026-09-27

Após autorização específica, as duas respostas protobuf salvas foram inspecionadas
localmente com Java e JavaScript, sem inicializar cliente Google, ler credenciais
ou executar novas chamadas. As imagens são controles tipográficos sintéticos;
as respostas examinadas continuam sendo capturas reais anteriores.

- O caractere de referência `t08` aparece uma vez no controle horizontal e zero
  vezes no vertical, em todas as representações examinadas: texto completo
  (`fullTextAnnotation.text`), descrições de `textAnnotations`, símbolos dos
  parágrafos e texto do manifesto.
- O replay do mapper existente reproduz exatamente as regiões do manifesto nas
  duas orientações. A omissão já existe na resposta recebida, antes do mapper;
  não é perda causada pelo agrupamento ou pela ordenação local.
- A verificação da imagem confirma o glifo presente e com máscara de pixels
  idêntica entre os dois controles. Não há evidência de glifo ausente na geração.
- No vertical, a caixa do parágrafo esquerdo começa abaixo do glifo omitido.
  Isto descreve a geometria retornada, mas não distingue falha interna de detecção,
  segmentação ou reconhecimento do provider. A caixa global abranger o ponto não
  significa que o caractere tenha sido reconhecido.
- Os 32 arquivos originais examinados permaneceram idênticos por SHA-256.
  Inventários, hashes, comandos e erro de preparação ficam no relatório privado;
  não foram versionados texto OCR, resposta bruta ou caminhos privados.

A primeira preparação foi interrompida por uma entrada vazia final no classpath
registrado pelo Surefire. Ela foi removida explicitamente apenas do classpath do
diagnóstico, evitando interpretar o diretório atual como dependência. A análise
seguinte concluiu com bibliotecas locais existentes, sem instalação ou mudança
de código de produção.

Conclusão limitada a este controle: não há caractere retornado que uma correção
de ordem possa recuperar. Não inserir texto esperado nem ajustar o mapper para
produzir acerto artificial. A causa interna e a frequência do problema permanecem
desconhecidas. Qualquer experimento adicional com o provider requer plano e nova
autorização; a avaliação linguística de mangás continua pendente.

Incremento posterior autorizado: o [experimento de espaçamento](spacing-experiment-2026-09-27.md)
repetiu a omissão com os bytes originais e obteve cobertura completa no controle
com colunas afastadas. É evidência exploratória, sem mudança do worker ou
conclusão causal definitiva.
