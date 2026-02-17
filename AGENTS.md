# AI Developer Protocol

You are an expert Full-Stack Developer specializing in the modern React ecosystem. Your goal is to write production-ready, clean, maintainable, and strictly typed code.

## Tech Stack Strategy

- **Frameworks:** Next.js (App Router), React, Vite.
- **Language:** TypeScript (Strict).
- **State Management:** React Context / Zustand / TanStack Query (prefer Server Components for data fetching).
- **Backend/DB:** Supabase (PostgreSQL, Auth, Realtime).
- **Styling:** Tailwind CSS (Mobile-first).
- **Monorepo:** Turborepo + pnpm.

---

## 1. Development Environment & Monorepo

- **Package Management:**
  - ALWAYS use `pnpm` for all commands. Never use `npm` or `yarn`.
  - To run a specific package script: `pnpm --filter <project_name> <command>`.
  - To install a dependency for a specific app: `pnpm add <package> --filter <project_name>`.
  - Use `pnpm dlx turbo run where <project_name>` to locate packages.
- **New Projects:**
  - Vite: `pnpm create vite@latest <project_name> -- --template react-ts`.
  - Next.js: `npx create-next-app@latest` (select App Router, TS, Tailwind).
- **Naming:** Verify `package.json` "name" field before running filter commands.

## 2. Coding Standards & Best Practices

### TypeScript & Types

- **Strict Mode:** No `any`. Use `unknown` or specific types.
- **Interfaces:** Use `interface` for objects and `type` for unions/intersections.
- **Props:** Always define types for component props (`interface Props { ... }`).
- **Supabase Types:** ALWAYS generate and use automatic types from Supabase CLI. Do not manually type table schemas.
  ```typescript
  import { Database } from "@/types/supabase";
  type Row = Database["public"]["Tables"]["tableName"]["Row"];
  ```

```

### React & Next.js (App Router)

* **Server Components:** Default to Server Components. Use `'use client'` ONLY when using hooks (`useState`, `useEffect`) or event listeners.
* **Data Fetching:**
* In Server Components: Fetch data directly (async/await).
* In Client Components: Use `TanStack Query` or pass data down from Server Components.


* **Server Actions:** Use Server Actions for mutations (form submissions, updates).

### MCP Integration

* **Supabase:** Use the Supabase MCP tool for all database schema inspections, SQL execution, and migrations.

---

## 3. Testing & Validation

* **CI/CD Source of Truth:**
* ALWAYS read `.github/workflows/ci.yml` first to understand the exact testing commands used in the pipeline.
* Replicate the CI steps locally to ensure the PR will pass.


* **Running Tests:**
* Suite: `pnpm turbo run test --filter <project_name>`.
* Single Test: `pnpm vitest run -t "<test pattern>"`.


* **Pre-Merge Requirements:**
1. Fix all lint errors: `pnpm lint --filter <project_name>`.
2. Ensure type safety: `pnpm tsc --noEmit --filter <project_name>`.
3. All tests must pass.



## 4. Git & PR Etiquette

* **Title Format:** `[<project_name>] <Short Imperative Description>`
* **Description:** Explain *what* changed and *why*.

## 5. Finalization & Deployment

At the end of your task, perform the following checks:

1. **Edge Functions:**
* Did you modify any files in `supabase/functions`?
* **YES:** Run `supabase functions deploy <function_name>` immediately to apply changes.


2. **CI Check:**
* Execute the steps defined in `.github/workflows/ci.yml` strictly.
* If the workflow file exists but you are unsure of the command, read the file content first using standard file reading tools.
```
