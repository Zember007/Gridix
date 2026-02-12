import baseConfig from "@gridix/config/eslint";

const base = Array.isArray(baseConfig) ? baseConfig : [baseConfig];

export default [...base];
