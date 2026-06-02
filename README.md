# Lash Panel

Painel web mobile-first para profissionais de beleza, inicialmente focado em lash designers, gerenciarem clientes, produtos, fichas técnicas, anamnese, atendimentos, manutenção e lembretes manuais via WhatsApp.

## Stack

- React + TypeScript
- Vite
- TanStack Router / TanStack Start
- React Query
- Supabase
- TailwindCSS / shadcn
- Sonner

## Como Instalar

O app roda diretamente da raiz do repositório.

```bash
npm install
npm run dev
```

Scripts úteis:

```bash
npm run lint
npm run build
npm run preview
```

## Ambiente

Copie o exemplo e preencha as chaves do Supabase:

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Variáveis esperadas:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` podem ser usados no frontend.

`SUPABASE_SERVICE_ROLE_KEY` nunca deve ir para o frontend, GitHub, Vercel pública ou ZIP compartilhado. Se a service role já foi compartilhada fora do ambiente local seguro, rotacione a chave no Supabase.

Arquivos `.env`, `.env.local` e variações de ambiente não devem ser versionados. O único arquivo de ambiente rastreado deve ser `.env.example`.

## Supabase

Projeto remoto atual:

```bash
dsexdxcqvmfvlivulxev
```

As migrations ficam em:

```bash
supabase/migrations
```

Para aplicar o schema no Supabase:

```bash
npx supabase link --project-ref dsexdxcqvmfvlivulxev
npx supabase db push --linked
```

Para regenerar os tipos:

```bash
npx supabase gen types typescript --project-id dsexdxcqvmfvlivulxev --schema public > src/integrations/supabase/types.ts
```

No Windows PowerShell, prefira salvar a saída em UTF-8 se o redirecionamento gerar arquivo UTF-16.

## Fluxo MVP

- Autenticação por Supabase Auth.
- CRUD de clientes com busca por nome e telefone.
- Produtos com tipos como cola, fios, removedor, primer, cleanser e outros.
- Ficha técnica vinculada à cliente, com múltiplos tamanhos de fio e cola cadastrada.
- Configurações de manutenção e mensagens padrão.
- Anamnese vinculada à cliente.
- Atendimentos com status agendado, concluído, cancelado e falta.
- WhatsApp manual via `wa.me`, com log de abertura manual.
- Dashboard com total de clientes, atendimentos do dia, manutenções próximas e produtos em alerta.

## Roadmap

- Link público para cliente preencher anamnese.
- Agenda mais completa com calendário.
- Histórico avançado de manutenções.
- Relatórios de estoque e consumo de produtos.
- Integração real de WhatsApp por backend seguro, sem tokens no frontend.
