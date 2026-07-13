import type { PluginOption } from 'vite'

export interface Options {
  [key: string]: unknown
}

export default function react(options?: Options): PluginOption[]
