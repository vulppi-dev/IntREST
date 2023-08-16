import { randomUUID } from 'crypto'
import { Worker } from 'worker_threads'
import { defaultPaths } from './constants'
import { join } from 'path/posix'

function workerURL(path: string) {
  return new URL(join('.', path), import.meta.url)
}

interface WorkerPool {
  weight: number
  worker: Worker
  workerId: number
}

const workerPool = new Map<number, WorkerPool>()

/**
 * Initialize the worker pool
 */
export async function startWorker(size: number) {
  for (let i = 0; i < size; i++) {
    const worker = new Worker(workerURL(defaultPaths.workerRouter), {
      env: process.env,
    })
    worker.setMaxListeners(Infinity)
    workerPool.set(worker.threadId, {
      weight: 0,
      worker,
      workerId: worker.threadId,
    })
  }
}

export async function stopWorkers() {
  for (const worker of workerPool.values()) {
    worker.worker.terminate()
  }
  workerPool.clear()
}

export async function workerTunnel(
  { basePath, data, config }: Omit<WorkerProps, 'requestId'>,
  cb: (state: ResponseState, data: ResponseData) => void,
) {
  return new Promise<void>((resolve, reject) => {
    // Generate a random request id
    const requestId = randomUUID()
    // Get the list of workers
    const workerList = Array.from(workerPool.values())
    // Try to find a worker with weight 0
    let workerItem = workerList.find((w) => w.weight === 0)
    let worker: Worker
    let workerId: number

    // If no worker with weight 0 is found
    // and the worker pool size is less than the max size,
    // find a worker with the lowest weight
    if (
      !workerItem &&
      workerList.length < (config.limits?.maxWorkerPoolSize || 20)
    ) {
      // Create a new worker
      const worker = new Worker(workerURL(defaultPaths.workerRouter), {
        env: process.env,
      })
      worker.setMaxListeners(Infinity)
      workerItem = {
        weight: 0,
        worker,
        workerId: worker.threadId,
      }
      // Add the worker to the worker pool
      workerPool.set(worker.threadId, workerItem)
    } else if (!workerItem) {
      workerItem = workerList.reduce((a, b) => (a.weight < b.weight ? a : b))
    }

    // Increase the worker weight, because it is busy with a request
    workerItem.weight++
    worker = workerItem.worker
    workerId = workerItem.workerId

    // Handle worker exit, if a catastrophic error occurs
    const handleExit = (code: number) => {
      workerPool.delete(workerId)
      worker.off('exit', handleExit)
      reject(new Error(`Worker stopped with exit code ${code}`))
    }
    worker.once('exit', handleExit)

    // Handle worker error, if a catastrophic error occurs
    const handleError = (err: Error) => {
      reject(err)
      workerItem && workerItem.weight--
      worker.off('error', handleError)
      worker.off('exit', handleExit)
    }
    worker.once('error', handleError)

    // Handle worker message, and call the callback function if the request id matches
    const handleMessage = (r: TransferResponse) => {
      if (r.requestId !== requestId) return

      cb(r.state, r.data)
      if (r.state === 'end') {
        workerItem && workerItem.weight--
        worker.off('message', handleMessage)
        worker.off('error', handleError)
        worker.off('exit', handleExit)
        resolve()
      }
    }
    worker.on('message', handleMessage)
    // Send the data to the worker router
    worker.postMessage({
      data,
      basePath,
      config,
      requestId,
    })
  })
}
