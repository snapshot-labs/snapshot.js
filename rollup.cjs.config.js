import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import { string } from 'rollup-plugin-string';
import pkg from './package.json';

const input = 'src/index.ts';
const dependencies = [...Object.keys(pkg.dependencies || {})];
// match subpath imports too (e.g. viem/ens)
const external = (id) =>
  dependencies.some((dep) => id === dep || id.startsWith(`${dep}/`));

export default [
  {
    input,
    external,
    output: [{ file: pkg.main, format: 'cjs' }],
    plugins: [
      json(),
      typescript({ clean: true }),
      string({
        include: '**/*.md'
      })
    ]
  }
];
