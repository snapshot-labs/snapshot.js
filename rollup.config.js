import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import json from 'rollup-plugin-json';
import pkg from './package.json';

const name = 'snapshot';
const input = 'src/index.ts';
const external = [...Object.keys(pkg.dependencies || {})];

export default [
  {
    input,
    context: 'window',
    output: [
      { name, file: pkg.browser, format: 'umd' }
    ],
    plugins: [
      json(),
      builtins(),
      typescript({ clean: true }),
      nodeResolve({ preferBuiltins: true, browser: true }),
      commonjs(),
      globals(),
      terser(),
      filesize()
    ]
  },
  {
    input,
    external,
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [
      json(),
      typescript({ clean: true })
    ]
  }
];
