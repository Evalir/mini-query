import { QueryObserver } from "./QueryObserver"

const fetchFn = () =>
  new Promise(function (resolve) {
    setTimeout(resolve, 1000, "hello world!")
  })

const fetchFnTwo = () =>
  new Promise(function (_, reject) {
    setTimeout(reject, 1000, new Error('Whoops'))
  })

const queryObserver = new QueryObserver(fetchFn, {
  listeners: [(res) => console.log(res)],
})

const queryObserverTwo = new QueryObserver(fetchFnTwo, {
  listeners: [(res) => console.log(res)],
})

queryObserver.fetch()
queryObserverTwo.fetch()
