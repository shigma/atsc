#!/usr/bin/env node

import { build } from '.'
import { compile } from 'tsconfig-utils'

const cwd = process.cwd()
const args = process.argv.slice(2)

Promise.all([
  build(cwd, args),
  compile(args),
])
