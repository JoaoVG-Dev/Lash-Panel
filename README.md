# Lash Panel

Painel web/mobile-first para profissionais de beleza gerenciarem clientes, fichas tecnicas, produtos, anamnese, agenda, manutencoes e lembretes via WhatsApp.

## Como rodar

O projeto agora roda diretamente da raiz do repositorio.

```bash
npm install
npm run dev
```

Scripts principais:

```bash
npm run lint
npm run build
npm run preview
```

## Ambiente

Crie um arquivo `.env` local na raiz do repositorio com as variaveis do Supabase:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

O arquivo `.env` nao deve ser versionado.

## Supabase

As migrations ficam em:

```bash
supabase/migrations
```

O arquivo de configuracao local do Supabase fica em:

```bash
supabase/config.toml
```
