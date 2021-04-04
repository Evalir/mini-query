import { Action, Query, QueryFunction } from "./Query"
import { Subscribable } from "./subscribable"
import { shallowEqualObjects } from "./utils"

export type QueryObserverListener<TData, TError> = (
  result: QueryResult<TData, TError>
) => void

export interface QueryResult<TData, TError> {
  data: TData | undefined
  error: TError | null
  status: "idle" | "error" | "loading" | "success"
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
}

export interface QueryObserverOptions<TData, TError> {
  fetchOnMount?: boolean
  listeners: QueryObserverListener<TData, TError>[]
}

const INITIAL_QUERY_OBSERVER_RESULT = {
  data: undefined,
  error: null,
  status: "idle",
  isLoading: false,
  isError: false,
  isSuccess: false,
}

export class QueryObserver<
  TData = unknown,
  TError = unknown
> extends Subscribable<QueryObserverListener<TData, TError>> {
  private currentResult: QueryResult<TData, TError>
  private query: Query<TData, TError>

  constructor(
    queryFn: QueryFunction<TData>,
    options: QueryObserverOptions<TData, TError> = {
      fetchOnMount: false,
      listeners: [],
    }
  ) {
    super()

    this.currentResult = INITIAL_QUERY_OBSERVER_RESULT as QueryResult<
      TData,
      TError
    >
    this.query = new Query(queryFn)
    // Observe our own query to get low-level updates of it
    this.query.addObserver(this as QueryObserver)

    for (const listener of options.listeners) {
      this.subscribe(listener)
    }

    if (options.fetchOnMount) {
      this.query.fetch()
    }
  }

  onQueryUpdate(action: Action<TData, TError>): void {
    const previousResult = this.currentResult

    const { state } = this.query

    const result: QueryResult<TData, TError> = {
      data: state.data,
      error: state.error,
      status: state.status,
      isLoading: action.type === "fetch",
      isError: action.type === "error",
      isSuccess: action.type === "success",
    }

    if (shallowEqualObjects(result, previousResult)) {
      return
    }

    this.currentResult = result

    this.notify(result)
  }

  fetch(): void {
    this.query.fetch()
  }

  refetch(): void {
    this.fetch()
  }

  private notify(result: QueryResult<TData, TError>): void {
    this.listeners.forEach((listener) => {
      listener(result)
    })
  }
}
