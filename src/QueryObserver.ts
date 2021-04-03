import { Subscribable } from "./subscribable"

export class QueryObserver extends Subscribable {
  onQueryUpdate(data: unknown): void {
    console.log(data)
  }
}
