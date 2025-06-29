import { reconcile } from './reconcile.ts'
import type { WatchMoneyworksConfig } from './types.ts'
import type { Artifact } from '@artifact/client/api'
import type { MoneyworksServer } from './moneyworks-server.ts'
import Debug from 'debug'

const debug = Debug('crm:watch')

function createCommitWatcher(branch: Artifact['branch']) {
  let nextResolve: (winner: Winner) => void
  let nextPromise = new Promise<Winner>((resolve) => {
    nextResolve = resolve
  })

  const watch = async () => {
    // TODO make this recover from errors
    for await (const evt of branch.read.watch()) {
      if (evt.type === 'commit') {
        debug('commit', evt)
        nextResolve({ type: 'commit' })
        nextPromise = new Promise((resolve) => {
          nextResolve = resolve
        })
      }
    }
  }
  watch()

  return () => {
    return nextPromise
  }
}

type Winner = { type: 'commit' } | { type: 'delay' }
const delay = (ms: number) =>
  new Promise<Winner>((resolve) =>
    setTimeout(() => resolve({ type: 'delay' }), ms)
  )

export async function watch(
  config: WatchMoneyworksConfig,
  artifact: Artifact,
  moneyworks: MoneyworksServer,
) {
  const changes = artifact.checkout({ branch: config.changesBranch })
  const next = createCommitWatcher(changes.branch)
  let commitPromise = next()

  while (true) {
    await reconcile(config, artifact, moneyworks)
    debug('watching')
    const winner = await Promise.race([
      commitPromise,
      delay(config.pollingInterval),
    ])
    if (winner.type === 'commit') {
      commitPromise = next()
    }
    await delay(10) // soften any runaway looping
  }
}
