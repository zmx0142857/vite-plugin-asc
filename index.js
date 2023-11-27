import fs from 'node:fs'
import { resolve } from 'path/posix'

const name = 'vite-plugin-asc'
const TAG = `[${name}]`
const wasmReg = /\.wasm$/
const isProd = process.env.NODE_ENV === 'production'

/**
 * Vite plugin for AssemblyScript Compiler (asc)
 * @param {object} options
 * @param {RegExp} options.ext default /\.ts\?init$/
 * @param {string} options.entry default 'src/as/index.ts'
 * @param {string} options.outFile default 'index.wasm'
 */
export default function vitePluginAsc (options = {}) {
  options = Object.assign({
    ext: /\.ts\?init$/,
    entry: 'src/as/index.ts',
    outFile: 'index.wasm',
  }, options)
  if (!wasmReg.test(options.outFile)) {
    throw new Error('outFile must end with ".wasm"')
  }
  options.textFile = options.outFile.replace(wasmReg, '.wat')
  options.target = isProd ? 'release' : 'debug'

  const wasmDir = './node_modules/.vite-plugin-asc/wasm'
  const relatives = {
    wasmDir,
    outFile: `${wasmDir}/${options.outFile}`,
    textFile: `${wasmDir}/${options.textFile}`,
    mapFile: `${wasmDir}/${options.outFile}.map`,
  }

  const absolutes = {
    wasmDir: resolve(relatives.wasmDir),
    outFile: resolve(relatives.outFile),
    mapFile: resolve(relatives.mapFile),
    configFile: resolve('./asconfig.json'),
    asc: resolve('./node_modules/assemblyscript/dist/asc.js')
  }

  const writeConfig = async () => {
    if (fs.existsSync(absolutes.configFile)) return
    console.log(TAG, 'generating asconfig.json...')
    const config = {
      targets: {
        debug: {
          outFile: relatives.outFile,
          textFile: relatives.textFile,
          sourceMap: true,
          debug: true,
        },
        release: {
          outFile: relatives.outFile,
          textFile: relatives.textFile,
          sourceMap: true,
          optimizeLevel: 3,
          shrinkLevel: 0,
          converge: false,
          noAssert: false
        }
      },
      options: {
        bindings: 'esm'
      }
    }
    return fs.promises.writeFile(absolutes.configFile, JSON.stringify(config, undefined, 2))
  }

  return {
    name,
    config: () => ({
      server: { watch: { ignored: [absolutes.wasmDir] } }
    }),
    buildStart: () => {
      if (fs.existsSync(absolutes.wasmDir)) fs.rmSync(absolutes.wasmDir, { recursive: true })
    },
    resolveId: (id) => {
      return options.ext.test(id) ? id : undefined
    },
    transform: async (code, id) => {
      if (!options.ext.test(id)) return
      fs.mkdirSync(absolutes.wasmDir, { recursive: true })
      await writeConfig()
      let asc
      try {
        asc = await import(absolutes.asc)
      } catch (err) {
        throw new Error('assemblyscript compiler is not found, you may try:\n\n  npm i -D assemblyscript\n\n')
      }
      const { error } = await asc.main([options.entry, '--target', options.target], {
        stdout: process.stdout,
        stderr: process.stderr,
      })
      if (error) throw error
      const map = isProd ? null : await fs.promises.readFile(absolutes.mapFile, 'utf-8')
      return {
        code: `export { default } from '${absolutes.outFile}?init';`,
        map, // TODO: this source map doesn't work
      }
    }
  }
}
