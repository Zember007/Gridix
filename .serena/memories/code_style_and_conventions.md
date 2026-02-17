# Code Style and Conventions

- Use TypeScript in strict mode; avoid `any`.
- Prefer `interface` for object shapes and `type` for unions/intersections.
- Type all component props explicitly.
- Prefer production-ready, maintainable code with clear naming.
- Frontend stack conventions: React + Vite, Tailwind CSS mobile-first.
- For Next.js work (if applicable): default to Server Components, `use client` only when needed.
- Use generated Supabase DB types; do not handcraft table schema types.
- Package management is pnpm-only (no npm/yarn).
- Follow monorepo patterns and package names from each `package.json`.
