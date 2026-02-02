import config from "@gridix/config/eslint";

import path from "node:path";
import { fileURLToPath } from "node:url";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default config.map((entry) => ({
  ...entry,
  languageOptions: {
    ...(entry.languageOptions ?? {}),
    parserOptions: {
      ...(entry.languageOptions?.parserOptions ?? {}),
      tsconfigRootDir,
    },
  },
}));
