import { performance } from 'perf_hooks'

async function runBenchmark() {
  const url = 'http://localhost:4001/' // Substitua pela URL da sua aplicação RESTful

  const numRequests = 1000 // Número total de requisições para o benchmark

  const results = []

  for (let i = 0; i < numRequests; i++) {
    results.push(await sendRequest(url))
  }

  // Cálculo das estatísticas
  const minTime = Math.min(...results)
  const maxTime = Math.max(...results)
  const avgTime = results.reduce((sum, time) => sum + time, 0) / numRequests

  console.log('--- Benchmark Results ---')
  console.log(`Number of Requests: ${numRequests}`)
  console.log(`Minimum Time: ${minTime.toFixed(2)} ms`)
  console.log(`Maximum Time: ${maxTime.toFixed(2)} ms`)
  console.log(`Average Time: ${avgTime.toFixed(2)} ms`)
}

async function sendRequest(url) {
  const startTime = performance.now()

  try {
    await fetch(url)
    const endTime = performance.now()
    const elapsedTime = endTime - startTime
    console.log(`Request completed in ${elapsedTime.toFixed(2)} ms`)
    return elapsedTime
  } catch (error) {
    console.log(`Request error: ${error.message}`)
    return 0
  }
}

runBenchmark()
