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
  loaders?: string[]
}

export async function build(cwd: string, args: string[] = []) {
  const config = await load(cwd, args)
  const outDir = config.get('outDir')
  const rootDir = config.get('rootDir')
  const noEmit = config.get('noEmit')
  const emitDeclarationOnly = config.get('emitDeclarationOnly')
  if (!outDir || !rootDir || noEmit || emitDeclarationOnly) return

  const loaders = config.atsc?.loaders || ['.yaml', '.yml']

  const files = await globby(['**'], {
    cwd: resolve(cwd, rootDir),
    onlyFiles: true,
  })

  await Promise.all(files.map(async (file) => {
    const ext = extname(file)
    if (['.ts', '.mts', '.cts', '.tsx'].includes(ext)) return
    const src = resolve(cwd, rootDir, file)
    const dest = resolve(cwd, outDir, file)
    await fs.mkdir(dirname(dest), { recursive: true })
    if (!loaders.includes(ext)) {
      await fs.copyFile(src, dest)
    } else if (['.yaml', '.yml'].includes(ext)) {
      const data = yaml.load(await fs.readFile(src, 'utf8'))
      await fs.writeFile(dest.slice(0, -ext.length) + '.json', JSON.stringify(data))
    }
  }))
}
