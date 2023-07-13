import { Worker } from 'worker_threads'
import { resolveModule } from '../utils/path'

const wFile = resolveModule('./router.mjs')

export async function callWorker(
  { route, basePath, data, config }: WorkerProps,
  cb: (state: ResponseState, data: ResponseData) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const worker = new Worker(wFile, {
      workerData: {
        data,
        route,
        basePath,
        config,
      },
      env: process.env,
    })

    worker.on('error', function (err) {
      reject(err)
    })
    worker.on('exit', (code) => {
      if (code !== 0)
        return reject(new Error(`Worker stopped with exit code ${code}`))
      cb('end', undefined)
      resolve()
    })
    worker.on('message', (r: TransferResponse) => {
      cb(r.state, r.data)
    })
  })
}
