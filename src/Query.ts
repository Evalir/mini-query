import { Retrier } from "./Retrier"
import { QueryObserver } from "./QueryObserver"

export interface QueryState<TData, TError> {
  data: TData | undefined
  error: TError | null
  status: "idle" | "error" | "loading" | "success"
}

export interface ErrorAction<TError> {
  error: TError
  type: "error"
}

export interface FetchAction {
  type: "fetch"
}

export interface SuccessAction<TData> {
  data: TData
  type: "success"
}

export type Action<TData, TError> =
  | ErrorAction<TError>
  | FetchAction
  | SuccessAction<TData>

export type QueryFunction<TData> = () => TData | Promise<TData>

const INITIAL_QUERY_STATE = {
  data: undefined,
  error: null,
  status: "idle",
}

export class Query<TData, TError> {
  state: QueryState<TData, TError>
  private observers: QueryObserver[]
  private queryFn: QueryFunction<TData>
  private retrier?: Retrier<TData, TError>

  constructor(queryFn: QueryFunction<TData>) {
    this.observers = []
    this.state = INITIAL_QUERY_STATE as QueryState<TData, TError>
    this.queryFn = queryFn
  }

  addObserver(observer: QueryObserver): void {
    if (this.observers.indexOf(observer) === -1) {
      this.observers.push(observer)
    }
  }

  fetch(): void {
    if (this.state.status === "loading") {
      return
    }

    this.dispatch({
      type: "fetch",
    })

    this.retrier = new Retrier({
      fn: this.queryFn,
      onError: (error) => {
        this.dispatch({
          type: "error",
          error,
        })
      },
      onSuccess: (data) => {
        this.dispatch({
          type: "success",
          data,
        })
      },
    })
  }

  reducer(
    state: QueryState<TData, TError>,
    action: Action<TData, TError>
  ): QueryState<TData, TError> {
    switch (action.type) {
      case "error":
        return {
          ...state,
          status: "error",
          error: action.error,
        }
      case "fetch":
        return {
          ...state,
          status: "loading",
        }
      case "success":
        return {
          ...state,
          status: "success",
          data: action.data,
        }
      default:
        return state
    }
  }

  private dispatch(action: Action<TData, TError>): void {
    this.state = this.reducer(this.state, action)

    this.observers.forEach((observer) => {
      observer.onQueryUpdate(action)
    })
  }
}
