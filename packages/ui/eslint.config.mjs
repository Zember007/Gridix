import baseConfig from "@gridix/config/eslint";

const base = Array.isArray(baseConfig) ? baseConfig : [baseConfig];

export default [
  ...base,
  // `@gridix/ui` includes some vendor-like primitives where `any`/ts-comments are acceptable.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];

