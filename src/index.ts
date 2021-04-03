import { Query } from "./Query"

import { QueryObserver } from "./QueryObserver"

const fetchFn = (a = "a") => Promise.resolve({ json: a })

const queryManager = new Query(fetchFn)
const queryObserver = new QueryObserver()

queryManager.addObserver(queryObserver)

queryManager.fetch()
