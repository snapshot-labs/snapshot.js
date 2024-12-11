import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import json from 'rollup-plugin-json';
import { string } from 'rollup-plugin-string';
import glob from 'glob';

import pkg from './package.json';

const name = 'snapshot';
const inputFiles = glob.sync('src/**/*.ts'); // Find all TypeScript files in nested directories
const external = [...Object.keys(pkg.dependencies || {})];

const createConfig = (input) => ({
  input,
  context: 'window',
  output: [
    {
      name,
      file: `dist/${input.replace(/src\/(.+)\.ts$/, '$1.js')}`,
      format: 'umd'
    }
  ],
  external,
  plugins: [
    json(),
    builtins(),
    typescript({ clean: true }),
    nodeResolve({ preferBuiltins: true, browser: true }),
    commonjs(),
    globals(),
    terser(),
    filesize(),
    string({
      include: '**/*.md'
    })
  ]
});

const umdConfigs = inputFiles.map((input) => createConfig(input));

export default [
  ...umdConfigs,
  {
    input: 'src/index.ts',
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
