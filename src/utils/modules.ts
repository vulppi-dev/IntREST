import { pathToFileURL } from 'url'

export async function getConfigModule(configPath?: string) {
  if (!configPath) return {} as Vulppi.KitConfig
  const configURL = pathToFileURL(configPath)
  configURL.searchParams.set('update', Date.now().toString())
  return await import(configURL.toString()).then(
    (m) => m.default as Vulppi.KitConfig,
  )
}
