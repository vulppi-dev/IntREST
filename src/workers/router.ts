import { parentPort } from 'worker_threads'
import { tunnel } from '../utils/tunnel'

parentPort!.on(
  'message',
  async ({ config, basePath, data, requestId }: WorkerProps) => {
    await tunnel(
      {
        data,
        config,
        basePath,
      },
      (state, data) => {
        parentPort?.postMessage({
          requestId,
          state,
          data,
        })
      },
    )
  },
)
