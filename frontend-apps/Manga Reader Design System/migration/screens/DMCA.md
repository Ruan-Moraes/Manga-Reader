# DMCA — Direitos autorais

## Rota

`/legal/dmca`

## Layout em árvore

```
<LegalShell page="dmca"
           eyebrow="Documentos legais"
           title="DMCA / Direitos autorais"
           sub="Procedimento pra pedidos de remoção por violação de direitos autorais..."
           updated="DD/MM/AAAA"
           version="vX.Y"
           toc={[8 seções]} />
```

## Conteúdo das 8 seções

1. O que é, em poucas linhas
2. Quem pode pedir remoção
3. Como pedir remoção
4. Informações necessárias (com `<CalloutDanger>` sobre falsidade)
5. Prazo de resposta
6. Contra-notificação
7. Reincidência
8. Agente designado (com `<DefList>` mostrando email + endereço postal)

## Componente especial: callout de aviso

```tsx
<aside className="flex gap-3 rounded-mr-sm border border-mr-danger/40 border-l-[3px] bg-[rgba(255,120,79,0.06)] p-3 text-[#ffb59c]">
  <Bell className="size-4 text-mr-danger" />
  <p><strong>Atenção:</strong> declarações falsas...</p>
</aside>
```

Usa border-left 3px coral, fundo translúcido coral, ícone Bell.

## Estados, comportamentos, responsividade, a11y

Idênticos ao **Terms.md**.

## Notas específicas

- Footer CTA: "Tem um caso urgente?" + Button "Canal prioritário" → `/legal/contact` com pre-selected
- Lista 8 seções tem maior dependência de definições — usar `<DefList>` em "Agente designado"
- Em **Reincidência**, citar literal "17 U.S.C. § 512(i)" pra rigor legal
