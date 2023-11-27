import type { PluginOption } from 'vite'

declare type AscPluginType = (options: {
  ext?: RegExp
  entry?: string
  outFile?: string
}) => PluginOption

declare const Asc: AscPluginType

export default Asc
