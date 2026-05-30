# Contact — Contatos

> Diferente dos outros 3 documentos legais: **sem TOC** (não há seções longas pra navegar). Layout vira coluna única.

## Rota

`/legal/contact`

## Layout em árvore

```
<LegalShell page="contact"
           eyebrow="Documentos legais"
           title="Contatos"
           sub="Pra cada tipo de assunto, um canal."
           updated="DD/MM/AAAA"
           toc={null}>   ← null faz o shell colapsar pra coluna única (max-w 960)
│
├── Section 01 "Canais diretos"
│   └── grid de 6 cards (1/2/3 colunas)
│       Cada card:
│       ├── Header: ícone (40 box accent-25) + label "GERAL/SUPORTE/DMCA/..."
│       ├── <h3> Título do canal
│       ├── Descrição
│       ├── Email pill (mailto link)
│       └── SLA · "até X em dias úteis"
│
│   Card "Prioritário" tem variante danger (ícone coral)
│
├── Section 02 "Enviar mensagem" (formulário catch-all)
│   ├── Header (form-head): título + sub explicando roteamento
│   ├── Row: nome + email (split em 2 cols ≥sm)
│   ├── Select assunto (com 6 opções correspondentes aos canais)
│   ├── Textarea mensagem
│   └── Footer: meta (tempo médio resposta) + Button primary "Enviar mensagem"
│
│   Após envio: estado <ContactSuccess> com ilustração chibi `feliz` + mensagem
│
└── Section 03 "Endereço postal"
    └── DefList:
        ├── Sede administrativa (endereço completo)
        └── Encarregado de dados (DPO + email)
```

## Componentes

`LegalShell`, `Card` (contact-card), `Input`, `Textarea`, `Select`, `Button`, `EmptyState` (`feliz`), `Badge`, `Icon`.

## Estados

| Estado | UI |
|---|---|
| Loading | sem skeleton — página é estática |
| idle | grid + form vazio |
| submitting | Button loading |
| sent | replace form section com ContactSuccess |
| validation error | Inputs com error states |

## Comportamentos

- **Canais** com email = `<a href="mailto:...">`
- **Formulário** roteia internamente baseado em `topic` selecionado
- **ContactSuccess** mostra: ilustração feliz + "Mensagem enviada" + "Respondemos no email {email}" + Button "Enviar outra" (reset form)
- **Variante prioritário** tem aviso: usar só pra emergências reais

## Responsividade

| Breakpoint | Grid de canais |
|---|---|
| <640 | 1 coluna |
| 640–1023 | 2 colunas |
| ≥1024 | 3 colunas |

Form-row split:
- <640: stack
- ≥640: 2 cols

## A11y

- Cada `<article>` de canal com `aria-label="Canal: {title}"`
- Form com `<form>` + labels associadas
- Estado de sucesso anunciado via `role="status"`
- mailto links em `<a>` real (não imitação com onClick)
