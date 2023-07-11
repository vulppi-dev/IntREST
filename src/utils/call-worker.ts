import { Worker } from 'worker_threads'
import { resolveModule } from '../utils/path'

export async function callWorker({
  route,
  basePath,
  data,
  config,
}: CallWorkerProps) {
  const wFile = resolveModule('./router.mjs')

  return new Promise<Vulppi.ResponseMessage>((resolve, reject) => {
    const worker = new Worker(wFile, {
      workerData: {
        data,
        route,
        basePath,
        config,
      },
      env: process.env,
    })
    let result: Vulppi.ResponseMessage | null = null

    worker.on('error', function (err) {
      reject(err)
    })
    worker.on('exit', (code) => {
      if (code !== 0)
        return reject(new Error(`Worker stopped with exit code ${code}`))
      resolve(result!)
    })
    worker.on('message', (r) => (result = r))
  })
}
