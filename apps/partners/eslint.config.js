import baseConfig from "@gridix/config/eslint";

const base = Array.isArray(baseConfig) ? baseConfig : [baseConfig];

export default [
  ...base,
  {
    files: ["tailwind.config.ts", "vite.config.*", "**/*.config.*"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
