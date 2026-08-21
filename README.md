# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
# famacarburant
# Fama Carburant

Next.js and TypeScript map for reporting fuel shortages in Tunisia.

## Local setup

```bash
npm install
npm run dev
```

Reports are persisted through `POST /api/reports`. During local development, the API writes directly into `public/signals.json` and removes reports older than seven days. On Vercel, it automatically uses Supabase instead of the non-persistent serverless filesystem.

## Deployment

For Vercel, add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or the supported `NEXT_PUBLIC_*` equivalents) as project environment variables, then run `supabase/schema.sql` in the Supabase SQL editor. The Supabase project and key must be active and belong to the same project URL.
