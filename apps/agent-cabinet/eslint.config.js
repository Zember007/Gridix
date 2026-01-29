import baseConfig from "@gridix/config/eslint";

const base = Array.isArray(baseConfig) ? baseConfig : [baseConfig];

export default [
  ...base,
  // Tooling configs sometimes use `require()` for compatibility.
  {
    files: ["tailwind.config.ts", "vite.config.*", "**/*.config.*"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

