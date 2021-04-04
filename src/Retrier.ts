import { sleep } from "./utils"

interface RetrierConfig<TData = unknown, TError = unknown> {
  fn: () => TData | Promise<TData>
  onError?: (error: TError) => void
  onSuccess?: (data: TData) => void
  retry?: boolean
  retryDelay?: number
  retryTimes?: number
}

const DEFAULT_RETRY_DELAY = 1000 // ms
const DEFAULT_RETRY_TIMES = 3

export class Retrier<TData = unknown, TError = unknown> {
  failureCount: number
  isResolved: boolean
  promise: Promise<TData>

  constructor(config: RetrierConfig<TData, TError>) {
    this.isResolved = false
    this.failureCount = 0
    let promiseResolve: (data: TData) => void
    let promiseReject: (error: TError) => void

    this.promise = new Promise<TData>((outerResolve, outerReject) => {
      promiseResolve = outerResolve
      promiseReject = outerReject
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolve = (value: any) => {
      if (!this.isResolved) {
        this.isResolved = true
        config.onSuccess?.(value)
        promiseResolve(value)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reject = (error: any) => {
      if (!this.isResolved) {
        this.isResolved = true
        config.onError?.(error)
        promiseReject(error)
      }
    }

    const run = () => {
      if (this.isResolved) {
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let promiseOrValue: any

      try {
        promiseOrValue = config.fn()
      } catch (err) {
        promiseOrValue = Promise.reject(err)
      }

      Promise.resolve(promiseOrValue)
        .then(resolve)
        .catch((err) => {
          if (this.isResolved) {
            return
          }

          const retries = config.retryTimes ?? DEFAULT_RETRY_TIMES
          const retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY
          const shouldRetry =
            config?.retry || this.failureCount < retries || false

          if (!shouldRetry) {
            reject(err)
            return
          }

          this.failureCount++

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          sleep(retryDelay).then(() => run())
        })
    }

    run()
  }
}
