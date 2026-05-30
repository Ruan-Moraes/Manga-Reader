# Privacy — Política de Privacidade

## Rota

`/legal/privacy`

## Layout em árvore

Idêntico ao **Terms** — usa o mesmo `LegalShell` com `page="privacy"`.

```
<LegalShell page="privacy"
           eyebrow="Documentos legais"
           title="Política de Privacidade"
           sub="O que coletamos, por quê, e como você manda no que é seu."
           updated="DD/MM/AAAA"
           version="vX.Y"
           toc={[12 seções]} />
```

## Conteúdo das 12 seções

1. Resumo em 30 segundos (TL;DR de destaque)
2. Quais dados coletamos (com `<DefList>` interno)
3. Como usamos
4. Base legal (LGPD art. 7)
5. Com quem compartilhamos
6. Cookies
7. Seus direitos (LGPD)
8. Retenção e exclusão
9. Segurança
10. Crianças e adolescentes
11. Transferências internacionais
12. Encarregado (DPO)

## Componente especial: lista de definições

Aparece na seção "Quais dados coletamos":

```
<dl className="legal-defs grid grid-cols-1 sm:grid-cols-2 gap-2">
  <dt>Cadastro</dt>
  <dd>Email, nome de exibição, senha (hash, nunca em texto puro).</dd>
  ...
</dl>
```

Estilo: cada par `<dt>+<dd>` num card `mr-surface` com border + padding 12px. `<dt>` em accent uppercase tracking-wide; `<dd>` em fg-muted body.

## Estados, comportamentos, responsividade, a11y

Idênticos ao **Terms.md**.

## Notas específicas

- Esta página é frequentemente requerida em compliance — manter Markdown source versionado em `legal/privacy.md` no repo, gerar HTML no build
- Botão CTA do footer card: "Abrir configurações" → `/settings` (em vez de "Falar com o time", porque LGPD se exerce em settings)
- Email do DPO: link `mailto:dpo@manga-reader.example.com`
