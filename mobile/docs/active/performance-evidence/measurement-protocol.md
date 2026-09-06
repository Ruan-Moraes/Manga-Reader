# Protocolo reproduzível de medição

Estado: **baseline nativo pendente**. Os cenários abaixo são especificações de
experimento, não execuções. Não há fixture de imagens ou trace nativo gerado nesta
rodada; só a fixture ASCII do ensaio local `reproduce.js` (não versionado) foi executada. Não reutilizar mídia
privada, tokens ou dados de conta em evidências versionadas.

## Preparação

1. Registrar commit e SHA-256 do runtime, build/configuração (release ou equivalente),
   dispositivo/OS, taxa de atualização, bateria/condição térmica, ferramentas e versões.
2. Registrar dados: quantidade, bytes, dimensões, formatos e checksums. Usar fixture
   sintética própria, sem download de conteúdo protegido e sem upload real.
3. Selecionar rede controlada normal/degradada/offline e cache frio/quente. Limpeza
   deve afetar somente instalação/dados de teste, sem apagar dados reais do usuário.
4. Abrir um cenário de cada vez. Fazer um aquecimento e cinco repetições. Guardar
   amostras individuais, mediana e amplitude, sem inferir p95 populacional.
5. Separar release (experiência), profiling (diagnóstico) e Node/Jest (mecanismo).
   Overhead de profiler deve ser registrado. Não comparar relógios/ambientes distintos.

## Matriz e fixtures a preparar

| Cenário             | Dados e ações                                                                                                      | Capturas / invariantes                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| S01 startup         | Guest e sessão de teste persistida; lançamento frio/quente, tema/idioma                                            | Tempo do lançamento até controle acionável, font/storage/session separadamente; sem flash/redirect indevido                             |
| S02 leitor          | Fixtures com 10, 67 e 200 páginas, números de ensaio sem significado de limite; dimensões heterogêneas e par ímpar | Mounts/commits, frames, memória JS/nativa, bytes de imagem; vertical/LTR/RTL/duplo, fit, gap, retry, rotação, volta à página            |
| S03 mídia           | 10, 67 e 200 arquivos sintéticos; JPEG/PNG/WebP válidos e inválidos                                                | Duração por etapa, SQL calls/linhas, pico/repouso memória, UI responsiva; progresso e persistência por item                             |
| S04 fronteiras      | Arquivos logo abaixo/no/acima de 26.214.400 bytes, 16.384 px de lado e 40.000.000 pixels, e formatos animados      | Rejeição antes de decode conforme política real; não confundir tamanho de arquivo com bitmap decodificado                               |
| S05 ciclos          | Dez ciclos de entrar/sair do leitor, preview e galeria; background/foreground durante operação                     | Séries memória/recursos após repouso equivalente, listeners/requests; estabilidade ou retenção justificada, sem alegar leak por um pico |
| S06 rede            | Fetch controlado com resposta atrasada, 401 simultâneo, offline, abort e active repetido                           | Calls, bytes, concurrency, tempo; refresh coalescido, retry/consentimento/idempotência preservados                                      |
| S07 limites gateway | ASCII de 65.535/65.536/65.537 bytes e UTF-8 multibyte; header ausente/incorreto/correto                            | Momento da rejeição e memória; Node cobre apenas 65.537 com/sem header nesta rodada                                                     |
| S08 export          | Fixture JSON sintética de 100 KiB, 1 MiB e 10 MiB (pontos de ensaio, não payloads reais)                           | Objeto/string/arquivo, serialização, pico de memória, responsividade, share cancelado/falho e limpeza                                   |
| S09 estado          | Alterar user e preferências não usadas; depois preferências relevantes                                             | Número/custo de commits e comportamento igual; não usar contagem de render isolada como diagnóstico de lentidão                         |

Os volumes são propostas de ensaio, sujeitos às restrições reais do fluxo. Se uma
fixture não for suportada, registrar rejeição/não aplicável, sem alterar limites.
Reutilizar o conjunto histórico de 67 imagens somente se disponível com autorização;
o número igual em fixture sintética não reproduz automaticamente a evidência antiga.

## Instrumentação

Usar React DevTools para commits; profiling nativo Android/iOS disponível para frames,
CPU e memória. Registrar comandos reais e arquivos de trace de cada execução.
Queries/linhas e requisições devem ser contadas em harness de teste/adaptador de
observação; qualquer instrumentação runtime exige tarefa separada, não faz parte
desta entrega documental. Não ativar logs contendo tokens, URIs privadas ou payloads.

Formato de amostra: cenário, repetição, buildHash, fixtureHash, device, OS,
cache/rede, métrica, unidade, valor, duração de repouso e caminho do trace.
Campo não medido fica `null` com motivo, nunca zero.

## Comparação e decisão

Aplicar primeiro o mesmo ensaio ao baseline e à correção. Reportar diferença e
variabilidade. Critérios funcionais vêm da spec; metas novas só são propostas após
baseline. Se resultados se sobrepuserem ou o ambiente variar, verdict inconclusivo;
não selecionar apenas a melhor repetição. Revisar aumento em outras dimensões e
custos de manutenção. Não encerrar melhoria com teste Jest como prova de fluidez.
