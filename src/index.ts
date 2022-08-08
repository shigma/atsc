import fs from 'fs/promises'
import globby from 'globby'
import tsconfig, { option } from 'tsconfig-utils'
import yaml from 'js-yaml'
import { dirname, extname, resolve } from 'path'

declare module 'tsconfig-utils' {
  interface tsconfig {
    atsc?: Config
  }
}

export interface Config {
  loaders?: string[]
}

export async function build(cwd: string, args: string[]) {
  const filename = option(args, ['-p', '--project'], () => 'tsconfig.json', true)
  const config = await tsconfig(resolve(cwd, filename))
  const { outDir, rootDir } = config.compilerOptions
  if (!outDir) return

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
