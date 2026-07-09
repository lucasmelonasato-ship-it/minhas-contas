# 💸 Minhas Contas — Gestão Financeira Pessoal

App para você **nunca mais esquecer de pagar uma conta**. Cadastre tudo que
você paga (contas fixas, financiamentos, cartões, assinaturas) e o app monta
automaticamente, todo mês, a lista do que precisa ser pago. Quando pagar, você
marca como pago e anexa o comprovante (foto ou PDF).

Funciona no **PC** (navegador) e no **iPhone** (instalável na tela de início,
abre em tela cheia como um app). É um **PWA**: rápido, funciona offline e os
dados ficam guardados **no próprio aparelho** — nada é enviado a servidores.

---

## ✨ O que ele faz

- **Cadastro de contas** em 3 tipos:
  - **Recorrente** — repete todo mês (aluguel, internet, assinaturas) ou todo ano.
  - **Parcelado** — financiamentos e compras em N parcelas (mostra 3/12, 4/12…).
  - **Avulsa** — uma conta única, numa data específica.
- **Visão do mês** — tudo que vence, agrupado em *Atrasadas · Vencem hoje · A pagar · Pagas*.
- **Registrar pagamento** com valor pago, data, quem pagou e **comprovante anexado**.
- **Tela inicial** — quanto falta pagar no mês, barra de progresso, alertas de
  contas atrasadas e vencendo em breve.
- **Relatórios** — evolução dos últimos 6 meses, gastos por categoria e por pessoa.
- **Galeria de comprovantes** — todos os comprovantes enviados, num lugar só.
- **Duas pessoas** (você e a namorada) — cada conta tem um responsável e dá para
  filtrar por pessoa.
- **Lembretes de verdade no iPhone** — exporte os vencimentos para o Calendário
  (`.ics`); o iPhone dispara os alertas de forma confiável.
- **Backup** — exporte/importe um arquivo com tudo (inclusive os comprovantes).

---

## 🚀 Como rodar no seu computador

Precisa ter o [Node.js](https://nodejs.org) instalado (versão 18+).

```bash
npm install     # instala as dependências (só na primeira vez)
npm run dev     # inicia em modo desenvolvimento
```

Abra o endereço que aparecer (algo como `http://localhost:5173`).

Para gerar a versão final otimizada:

```bash
npm run build   # gera a pasta dist/
npm run preview # testa a versão final localmente
```

---

## 🌐 Publicar online (grátis) e usar no iPhone

O jeito mais simples é o **GitHub Pages** (gratuito):

1. Suba este projeto para um repositório no GitHub.
2. No repositório, vá em **Settings → Pages** e, em *Source*, escolha
   **GitHub Actions**.
3. Pronto. A cada envio para a branch `main`, o app é publicado automaticamente
   (o workflow já está em `.github/workflows/deploy.yml`).
4. O link fica no formato `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

**Instalar no iPhone:** abra esse link no **Safari** → botão **Compartilhar**
→ **Adicionar à Tela de Início**. O app passa a abrir em tela cheia.

**Instalar no PC:** abra no Chrome/Edge e clique no ícone de instalar na barra
de endereço.

---

## 📱 Sobre os dados e o compartilhamento entre dois celulares

Os dados ficam **no navegador de cada aparelho** (tecnologia IndexedDB). Isso
traz privacidade total e funcionamento offline, mas significa que, por padrão,
o que você cadastra no seu iPhone **não aparece sozinho** no iPhone da sua
namorada.

Duas formas de manter os dois em sincronia:

1. **Simples (backup):** use *Ajustes → Exportar backup* e importe o arquivo no
   outro aparelho quando quiser igualar.
2. **Automática (nuvem):** dá para plugar uma camada de sincronização gratuita
   (ex.: Supabase) para os dois verem a mesma lista em tempo real. Essa parte é
   opcional e pode ser ativada depois — o app foi pensado para receber isso sem
   reescrever nada.

> **Backup é importante:** como os dados vivem no aparelho, exporte um backup de
> vez em quando (Ajustes → Exportar backup) e guarde em local seguro.

---

## 🛠️ Tecnologias

- **React + TypeScript + Vite** — base do app
- **Tailwind CSS** — estilo (visual limpo, estilo iOS)
- **Dexie (IndexedDB)** — banco de dados local no aparelho
- **Recharts** — gráficos dos relatórios
- **vite-plugin-pwa** — instalação e funcionamento offline

---

Feito com carinho para deixar o pagamento das contas simples e sem esquecimentos. 🧾✅
