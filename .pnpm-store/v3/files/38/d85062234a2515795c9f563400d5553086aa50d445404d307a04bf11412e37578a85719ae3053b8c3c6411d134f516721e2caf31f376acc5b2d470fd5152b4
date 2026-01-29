import typescript from 'rollup-plugin-typescript2'
import {terser} from 'rollup-plugin-terser'
import pkg from './package.json'

/** @type {import('rollup').RollupOptions} */
const config = {
  input: `src/usertour.ts`,
  output: [
    {
      file: pkg.main,
      name: 'usertour.js',
      format: 'umd',
      sourcemap: true
    },
    {file: pkg.module, format: 'es', sourcemap: true},
    {
      file: 'dist/usertour.snippet.min.js',
      format: 'iife',
      strict: false,
      plugins: [terser()]
    }
  ],
  plugins: [typescript({useTsconfigDeclarationDir: true})]
}

export default config
