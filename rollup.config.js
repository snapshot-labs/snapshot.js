import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import builtins from 'rollup-plugin-node-builtins';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import json from 'rollup-plugin-json';
import { string } from 'rollup-plugin-string';
import pkg from './package.json';

const name = 'snapshot';
const input = 'src/index.ts';
const external = [...Object.keys(pkg.dependencies || {})];

export default [
  {
    input,
    context: 'window',
    output: [
      {
        name,
        file: pkg.browser,
        format: 'umd',
        intro:
          'var global = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}'
      }
    ],
    plugins: [
      json(),
      builtins(),
      typescript({ clean: true }),
      nodeResolve({ preferBuiltins: true, browser: true }),
      commonjs(),
      inject({
        Buffer: ['buffer', 'Buffer']
      }),
      terser(),
      filesize(),
      string({
        include: '**/*.md'
      })
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
      typescript({ clean: true }),
      string({
        include: '**/*.md'
      })
    ]
  }
];
