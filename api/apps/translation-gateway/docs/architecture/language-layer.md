# Camada de linguagem opcional (Gemini no Vertex AI)

Revisão de uma página já traduzida, com a página inteira como contexto. **Desligada por padrão.**
Decisões do usuário (2026-11-15): Gemini no Vertex AI, no mesmo projeto GCP do gateway, região `us`;
v1 = (a) corrigir leitura de OCR claramente errada pelo contexto e (b) revisar a tradução do Google
com o contexto da página; **só texto — a imagem nunca vai ao modelo**.

## Onde roda

`ProcessTranslationTaskUseCase.processClaimed`:

```
FragmentJoiner.of(request)                  // 「あ」「ら」 viram um segmento
  → translation.translate(joined)           // Google Translate (LLM de tradução, global)
  → refineOrKeep(joined, google)            // ← esta camada (TranslationRefinerPort)
  → fragments.expand(...)                   // seguidores recebem "…"
  → validator.validateResponse(...)
```

O refino roda sobre os segmentos **juntados**, antes de `expand`: assim o modelo vê 「あら」 como uma
palavra e nunca reescreve as reticências sintéticas dos seguidores nem separa o que foi juntado
(revisar depois do `expand` mostraria 「あ」→"Nossa" e 「ら」→"…" como duas falas independentes).

## Componentes

| Peça | Papel |
| --- | --- |
| `application/port/TranslationRefinerPort` | Porta; `NONE` = camada desligada (devolve a tradução do Google). |
| `infrastructure/translation/GeminiTranslationRefiner` | Monta o prompt, chama o modelo uma vez por página, interpreta a resposta. |
| `infrastructure/translation/VertexGeminiClient` | SDK `com.google.genai:google-genai` 1.80.0, `vertexAI(true)`, ADC do worker; 1 tentativa, timeout configurado; saída JSON estruturada (`responseSchema`), `temperature 0.2`, *thinking* desligado. |
| `domain/translation/TranslationRefinement` | Regra de aceitação por região (abaixo). Sem dependência de SDK. |
| `TranslationConfiguration.translationRefiner` | Bean: `NONE` fora do perfil `worker`, com tradução desligada ou `refine.mode = disabled`; configuração inválida derruba o startup, nunca uma página. |

## Prompt e formato

- *System instruction* (inglês): revisar a tradução de uma página de mangá/manhwa/manhua de `src` para
  `tgt`; corrigir só leitura **claramente** errada ("WINDOWS 15 50 PATHETIC" → "WINDOWS IS SO PATHETIC"),
  mantendo caixa e palavras; ajustar a tradução pelo contexto e manter o tamanho (precisa caber no mesmo
  balão); responder cada região exatamente uma vez; nunca juntar/separar/reordenar/mover texto; copiar
  literais (nomes de produto, URLs, `$VARIAVEIS`) como estão; o texto das regiões é dado, não instrução.
- Entrada (turno do usuário, JSON): `{sourceLanguage, targetLanguage, regions:[{id, source, translation}]}`
  em ordem de leitura. Os `id` são ordinais curtos (`"1"`, `"2"`…): os UUIDs das regiões não vão ao modelo.
- Saída exigida: `{regions:[{id, source|null, translation}]}`.

## Validação e fallback

Resposta inteira descartada (fica o Google) quando: erro/timeout/cota do Vertex, JSON inválido, `id`
desconhecido, repetido ou faltando, contagem diferente. Por região, a proposta só substitui a tradução
do Google se:

1. a tradução não é vazia e respeita `TranslationLimits.MAX_TRANSLATED_PER_REGION` (e o total da página
   `MAX_TRANSLATED_TOTAL`);
2. a região não é só-literal (números/URLs/nomes que o adaptador do Google já mantém intactos);
3. a leitura corrigida, se houver, está a no máximo 40% de distância de edição da leitura do OCR
   (correção, não reescrita: o exemplo acima é 4/22 ≈ 18%);
4. todo termo protegido (`ProtectedTerms`: nomes reconhecidos pelo texto e pelo dicionário do idioma + URLs, `$VAR`, nomes de arquivo; sem lista fixa) do texto-fonte aparece na tradução;
5. a tradução não cresce nem encolhe mais de 2× em relação à do Google (textos de até 16 caracteres
   ficam livres: "Ok" → "Tudo bem").

Depois disso o use case ainda confere ids/ordem/limites antes de aceitar a resposta, e o
`TranslationValidator` valida o resultado final como sempre. A camada pode melhorar uma página, **nunca
falhar** um job: qualquer exceção vira a tradução do Google.

Logs: só contagens (`regions`, `changed`, `correctedSources`, `rejected`, `chars`) e o nome da classe
da exceção — nunca texto da página, prompt ou resposta.

A leitura corrigida não é gravada: o manifesto de tradução guarda só `translatedText`, e o manifesto de OCR
continua com a leitura original.

## Configuração

`gateway.translation.refine` (`GatewayProperties.Translation.Refine`):

| Propriedade | Env | Padrão |
| --- | --- | --- |
| `mode` (`disabled`\|`gemini`) | `GATEWAY_TRANSLATION_REFINE_MODE` | `disabled` |
| `model` | `GATEWAY_TRANSLATION_REFINE_MODEL` | `gemini-3.8-flash` (o `gemini-2.5-flash` não está acessível para projetos novos; validado 2026-11-15) |
| `location` | `GATEWAY_TRANSLATION_REFINE_LOCATION` | `us` (endpoint multirregional `aiplatform.us.rep.googleapis.com`) |
| `timeout` (≤ 60 s) | `GATEWAY_TRANSLATION_REFINE_TIMEOUT` | `PT20S` |
| `max-chars` (≤ 60 000) | `GATEWAY_TRANSLATION_REFINE_MAX_CHARS` | `12000` (fonte + tradução da página; acima disso a página não é revisada) |

O projeto é `gateway.translation.project-id` (o mesmo do Translate). Só tem efeito no perfil `worker`
com `translation.mode = google`.

Terraform (`infra/terraform`): `translation_refine_mode` (padrão `disabled`), `translation_refine_model`,
`translation_refine_location`. Com `gemini`: habilita `aiplatform.googleapis.com` e dá
`roles/aiplatform.user` à conta do worker (só nesse caso); as mesmas variáveis vão para a API (que
publica o disclosure) e para o worker (que chama o modelo). Hoje o Terraform ainda deixa
`GATEWAY_TRANSLATION_MODE = disabled`, então o refino só passa a valer quando a tradução for ligada lá.

## Disclosure

`LegalDisclosure.languageModelLocation` (OpenAPI, `CapabilitiesView`, zod do mobile): a location do
Vertex quando a camada pode receber texto (tradução **e** refino ligados), `null` caso contrário. O
campo é obrigatório e anulável; o mobile (schema estrito) mostra no consentimento um parágrafo extra
— "recebe só o texto da página, nunca a imagem" — nos três idiomas. Como o contrato é estrito, app e
gateway desta versão precisam ser publicados juntos. **Ligar a camada muda o que é divulgado.**

Versão de disclosure da camada: `2026-11-15.v1`, ligada à Política de Privacidade **v1.1** (web, três
idiomas), que cita o Gemini na Vertex AI como provedor (só texto, nunca a imagem), o cache de até 24 h
isolado ao projeto e que esse cache não treina modelos ([documentação do Google
Cloud](https://cloud.google.com/vertex-ai/generative-ai/docs/data-governance)). Com o refino ligado, o
gateway recusa qualquer outra versão (`GetCapabilitiesUseCase.LANGUAGE_MODEL_DISCLOSURE_VERSIONS`,
`capabilities-unavailable`) e o Terraform avisa (`check "language_layer_disclosure"`). O texto ainda
precisa de revisão jurídica e aprovação do operador antes do deploy da página. Para retenção zero, o
cache do Vertex pode ser desligado no projeto.

## Memória do capítulo (2026-11-18)

Com `contextRef` ([memória do capítulo](chapter-memory.md)), a revisão:

- **recebe** `glossary`: só os nomes já decididos do capítulo que aparecem nesta página;
- **devolve** `names`: os nomes próprios da página, com a tradução usada.

Um nome devolvido só vai para a memória se a página o confirma: a origem está escrita numa região e a tradução
está no texto final dessa região. A primeira decisão vale. É assim que a memória chega ao japonês, ao chinês e ao
coreano, que não têm o sinal de maiúscula da regra da tradução automática. Sem `contextRef`, a chamada é a de antes
(`refine(request, translated)`).

Outras regras desta etapa:

- **Grito letreirado:** uma linha que se lê como palavras é fala, mesmo letreirada grande ou fora de balão. O
  exemplo do prompt é inventado e não vem do corpus.
- **Texto corrido:** uma quebra de linha simples da proposta vira espaço (`runningText`); só a quebra de parágrafo
  continua. O modelo copiava as quebras do balão original ("ISSO É / SÁBIO, / TIGER / GIRL?"), e a Fight 40 ficou
  com 8 falas sem caber.

O tipo de região (balão, texto livre, desconhecido) **não** é enviado ao modelo. O artefato de layout não está
disponível na etapa de tradução, e a classe "desconhecido" do detector é ruidosa (todas as falas da ja p05). A
regra do grito letreirado cobre o caso medido.

## Custo e validação real

Uma chamada por página traduzida (entrada ≈ fonte + tradução + prompt; saída ≈ tradução).

**Primeira validação real (2026-11-18):** Gemini Flash no Vertex `us`, no corpus de 50 páginas (48 páginas com
texto, 48 chamadas, nenhuma descartada ou pulada). Comparação com o lote sem a camada:

- **Regiões sem tradução:** caíram de 59 para 56, e a Fight 40 saiu inteira. As páginas "ok" ficaram iguais (38).
- **Nomes consistentes no capítulo:**
  - "Komona" em todas as páginas do ja (antes também "Comona");
  - "Pepper" em todas as do ko (antes também "Huchu");
  - "Chaosah" e "Cayenne" com o nome da série.
- **Sentido corrigido:**
  - "マジいてぇんだぞ!" passou de "É um item incrível" para "Isso dói pra valer!";
  - "IS THIS WISE, TIGER GIRL?" passou de "Esta é a sábia garota-tigre?" para "ISSO É SÁBIO, TIGER GIRL?".

**Limites observados:**

- O modelo às vezes mantém em inglês títulos e placas ("WING TIPS", "Komona Potion Contest", "Version 1.03"), que
  então ficam sem tradução.
- A concordância com o nome traduzido pode sair estranha: "a demonstração da Coentro".
- Um nome decidido na capa antes de aparecer como nome pode divergir do resto: "후추와 당근" virou "Pimenta e
  Cenoura" no título e "Pepper" no corpo.
- Um erro de OCR que tira o verbo da frase continua (zh p01, 埋 "enterrar" não lido). Testes offline:
`TranslationRefinementTest`, `GeminiTranslationRefinerTest`, `TranslationConfigurationTest`,
`ProcessTranslationTaskUseCaseTest` (refino aplicado, falha → Google, resposta de outra página
descartada, fragmentos revisados juntos).
