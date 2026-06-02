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

Copie o exemplo e preencha as chaves públicas do Supabase:

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Variáveis usadas pelo frontend:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Aliases compatíveis usados em alguns contextos de build/CLI:

```bash
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` podem ser usados no frontend.

`SUPABASE_SERVICE_ROLE_KEY` nunca deve ir para o frontend, GitHub, Vercel pública ou ZIP compartilhado. Use service role somente em backend seguro, scripts locais controlados ou automações privadas. Se a service role já foi compartilhada fora de um ambiente local seguro, rotacione a chave no Supabase.

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

## Fluxo do MVP

- Autenticação por Supabase Auth.
- Onboarding inicial para configurar perfil profissional e dados do negócio.
- CRUD de clientes com busca por nome e telefone.
- Produtos com tipos como cola, fios, removedor, primer, cleanser e outros.
- Marcas de produtos cadastradas pelo usuário, com seleção por dropdown no cadastro de produto.
- Ficha técnica vinculada à cliente, com múltiplos tamanhos de fio e cola cadastrada.
- Configurações de manutenção, horários de atendimento e mensagens padrão.
- Anamnese interna vinculada à cliente.
- Link público de anamnese por token seguro, com expiração e preenchimento sem login.
- Atendimentos com filtros por período/status, reagendamento, conclusão, cancelamento e falta.
- WhatsApp manual via `wa.me`, com templates e log `manual_opened`.
- Dashboard com clientes ativas, atendimentos de hoje, próximas manutenções, produtos em alerta, próximos atendimentos e anamneses pendentes.

## WhatsApp Manual

O app não envia mensagens automaticamente nesta fase. Os botões abrem o WhatsApp via `wa.me` com mensagem pronta; a profissional confirma o envio na conversa.

Templates aceitam variáveis:

```txt
{nome}
{profissional}
{negocio}
{data}
{horario}
{link_anamnese}
```

Cada abertura manual é registrada em `whatsapp_message_logs` com status `manual_opened`.

## Produtos e Marcas

As marcas são gerenciadas dentro da tela de produtos. A profissional pode criar, editar e inativar marcas, e o cadastro de produto usa um dropdown com as marcas ativas. Se a marca ainda não existir, ela pode ser criada diretamente no modal do produto pela opção `+ Criar nova marca`.

Produtos antigos com `brand` em texto livre são migrados para `product_brands` pela migration `add_product_brands`; o campo `brand` permanece apenas como compatibilidade temporária.

## Deploy na Vercel

Este projeto usa TanStack Start/Nitro, não Vite estático puro. O build não deve ser publicado como `dist` porque a saída correta é gerada pelo Nitro em `.vercel/output`.

Configuração sugerida na Vercel:

- Root directory: raiz do repositório.
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: deixe vazio.
- Development command: `vite --port $PORT`

O build command gera:

```txt
.vercel/output
```

Não configure rewrite SPA para `/index.html`; este app usa SSR/server bundle.

Variáveis de ambiente necessárias na Vercel:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

Não configure `SUPABASE_SERVICE_ROLE_KEY` em ambientes públicos de frontend.

No Supabase Auth, adicione as URLs de redirect da Vercel:

```txt
https://seu-dominio.vercel.app
https://seu-dominio.vercel.app/login
```

Em previews da Vercel, adicione também os domínios de preview que forem usados em QA.

## Roadmap

- Agenda em calendário mensal/semanal.
- Histórico avançado de manutenções.
- Relatórios de estoque e consumo de produtos.
- Link público de agendamento.
- Integração real de WhatsApp por backend seguro, sem tokens no frontend.
