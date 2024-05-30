import fs from 'fs/promises'
import globby from 'globby'
import yaml from 'js-yaml'
import { load } from 'tsconfig-utils'
import { dirname, extname, resolve } from 'path'

declare module 'tsconfig-utils' {
  interface TsConfig {
    atsc?: Config
  }
}

export interface Config {
  ignored?: string[]
  converters?: string[]
}

export async function build(cwd: string, args: string[] = []) {
  const config = await load(cwd, args)
  const outDir = config.get('outDir')
  const rootDir = config.get('rootDir')
  const noEmit = config.get('noEmit')
  const emitDeclarationOnly = config.get('emitDeclarationOnly')
  if (!outDir || !rootDir || noEmit || emitDeclarationOnly) return

  const converters = config.atsc?.converters || ['.yaml', '.yml']
  const ignored = config.atsc?.ignored || ['.ts', '.mts', '.cts', '.tsx', '.mjs', '.cjs', '.js', '.jsx']

  const files = await globby(['**'], {
    cwd: resolve(cwd, rootDir),
    onlyFiles: true,
  })

  await Promise.all(files.map(async (file) => {
    const ext = extname(file)
    if (ignored.includes(ext)) return

    const src = resolve(cwd, rootDir, file)
    const dest = resolve(cwd, outDir, file)
    await fs.mkdir(dirname(dest), { recursive: true })
    if (converters.includes(ext) && ['.yml', '.yaml'].includes(ext)) {
      const data = yaml.load(await fs.readFile(src, 'utf8'))
      await fs.writeFile(dest.slice(0, -ext.length) + '.json', JSON.stringify(data) || '')
    } else {
      await fs.copyFile(src, dest)
    }
  }))
}
