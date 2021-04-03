type Listener = () => void

export class Subscribable<TListener extends Function = Listener> {
  protected listeners: TListener[]

  constructor() {
    this.listeners = []
  }

  subscribe(listener?: TListener): () => void {
    const callback = listener || (() => undefined)

    this.listeners.push(callback as TListener)

    this.onSubscribe()

    return () => {
      this.listeners = this.listeners.filter((x) => x !== callback)
      this.onUnsubscribe()
    }
  }

  hasListeners(): boolean {
    return this.listeners.length > 0
  }

  protected onSubscribe(): void {
    // Override me!
  }

  protected onUnsubscribe(): void {
    // Override me!
  }
}
