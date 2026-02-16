/** @type {import("stylelint").Config} */
module.exports = {
  extends: ["stylelint-config-standard-scss"],
  plugins: ["stylelint-scss"],
  ignoreFiles: [
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/build/**",
    "**/coverage/**",
    "**/.turbo/**",
  ],
  rules: {
    // Часто полезно в монорепах:
    "no-empty-source": null,
  },
  overrides: [
    {
      files: ["**/*.scss"],
      customSyntax: "postcss-scss",
    },
  ],
};
