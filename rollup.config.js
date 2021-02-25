import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import pkg from './package.json';

const input = 'src/index.ts';
const external = [...Object.keys(pkg.dependencies || {})];

export default [
  {
    input,
    external,
    output: [
      { file: pkg.main, format: 'cjs' }
    ],
    plugins: [
      json(),
      typescript({ clean: true })
    ]
  }
];
