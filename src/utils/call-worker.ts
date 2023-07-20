import { randomUUID } from 'crypto'
import { Worker } from 'worker_threads'
import { defaultPaths } from './constants'
import { join } from './path'

interface WorkerPool {
  weight: number
  worker: Worker
  workerId: number
}

const workerPool = new Map<number, WorkerPool>()

export async function startWorker(size: number) {
  for (let i = 0; i < size; i++) {
    const worker = new Worker(
      new URL(join('.', defaultPaths.workerRouter), import.meta.url),
      {
        env: process.env,
      },
    )
    worker.setMaxListeners(Infinity)
    workerPool.set(worker.threadId, {
      weight: 0,
      worker,
      workerId: worker.threadId,
    })
  }
}

export async function callWorker(
  { basePath, data, config }: Omit<WorkerProps, 'requestId'>,
  cb: (state: ResponseState, data: ResponseData) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const requestId = randomUUID()
    const workerList = Array.from(workerPool.values())

    let workerItem = workerList.find((w) => w.weight === 0)

    if (
      !workerItem &&
      workerList.length < (config.limits?.maxWorkerPoolSize || 20)
    ) {
      const worker = new Worker(new URL('./router.mjs', import.meta.url), {
        env: process.env,
      })
      worker.setMaxListeners(Infinity)
      workerItem = {
        weight: 0,
        worker,
        workerId: worker.threadId,
      }
      workerPool.set(worker.threadId, workerItem)
    } else if (!workerItem) {
      workerItem = workerList.reduce((a, b) => (a.weight < b.weight ? a : b))
    }

    workerItem.weight++
    const { worker, workerId } = workerItem

    const handleExit = (code: number) => {
      workerPool.delete(workerId)
      worker.off('exit', handleExit)
      reject(new Error(`Worker stopped with exit code ${code}`))
    }
    worker.once('exit', handleExit)

    const handleError = (err: Error) => {
      reject(err)
      workerItem!.weight--
      worker.off('error', handleError)
      worker.off('exit', handleExit)
    }
    worker.once('error', handleError)

    const handleMessage = (r: TransferResponse) => {
      if (r.requestId !== requestId) return

      cb(r.state, r.data)
      if (r.state === 'end') {
        workerItem!.weight--
        worker.off('message', handleMessage)
        worker.off('error', handleError)
        worker.off('exit', handleExit)
        resolve()
      }
    }
    worker.on('message', handleMessage)
    worker.postMessage({
      data,
      basePath,
      config,
      requestId,
    })
  })
}
