import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
export default tseslint.config(
  { ignores: ["dist", "supabase/functions/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        // Cursor/ESLint can lint from different working directories in this monorepo.
        // Setting an explicit root avoids ts-eslint ambiguity errors.
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // The codebase currently uses `any` in some integration-heavy areas.
      // We keep typechecking strict, but allow `any` in lint to avoid blocking CI.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Layer boundaries (FSD-like). We allow app-layer imports only inside src/app.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/app/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*"],
              message:
                "Do not import from app-layer outside of src/app. Move shared logic to shared/entities/features/widgets.",
            },
          ],
        },
      ],
    },
  },
  // Prevent direct Supabase client imports (use `@/shared/api/supabase` wrapper).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/integrations/**", "src/shared/api/supabase.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/integrations/supabase/client"],
              message:
                "Import Supabase client via `@/shared/api/supabase` (single boundary point).",
            },
          ],
        },
      ],
    },
  },
  // Entities should not depend on UI layers directly.
  {
    files: ["src/entities/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@/components/*", "@/pages/*"],
              message:
                "Entities should not import UI. Move composition into features/widgets/pages.",
            },
          ],
        },
      ],
    },
  },
  // Tooling configs sometimes use `require()` for compatibility.
  {
    files: ["**/*.config.*", "tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
