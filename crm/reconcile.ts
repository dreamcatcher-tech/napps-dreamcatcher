import { delay } from '@std/async'
import { CONFIG_PATH, configSchema } from './types.ts'
import { assert } from '@std/assert'
import type { WatchMoneyworksConfig } from './types.ts'
import pLimit from 'p-limit'
import { type Artifact, isCommitScope } from '@artifact/client/api'
import type { MoneyworksServer } from './moneyworks-server.ts'
import { pull } from './pull.ts'
import Debug from 'debug'
const log = Debug('crm:reconcile')

const limit = pLimit(100)

export async function reconcile(
  config: WatchMoneyworksConfig,
  artifact: Artifact,
  moneyworks: MoneyworksServer,
): Promise<void> {
  let ch = artifact.checkout({ branch: config.changesBranch })
  let mw = artifact.checkout({ branch: config.moneyworksBranch })
  ch = await ch.latest()

  const isChangesBlank = (await ch.shards.read.ls()).length === 0
  for (const table of config.tables) {
    mw = await pull(moneyworks, table, artifact)

    if (await isChangesSynced(mw, ch)) {
      log('changes are still synced')
      continue
    }

    assert(isCommitScope(mw.scope))
    const base = await ch.branch.read.findMergeBase(mw.scope)

    const mwDiff = await base.shards.read.diff({
      path: table,
      other: mw.scope,
    })

    if (isChangesBlank) {
      continue
    }

    for (const file of mwDiff.removed) {
      const path = `${table}/${file.path}`
      log('WARNING: moneyworks removed', path)
      ch.shards.write.rm(path)
    }

    log('syncing mw to ch branch')
    const cpPromises = []
    for (const file of [...mwDiff.added, ...mwDiff.modified]) {
      const path = `${table}/${file.path}`
      if (mwDiff.added.includes(file)) {
        log('moneyworks added', path)
      } else {
        log('moneyworks modified', path)
      }
      cpPromises.push(limit(async () => {
        assert(isCommitScope(mw.scope))
        await ch.shards.write.cp(path, path, mw.scope)
      }))
    }
    await trackProgress()
    await Promise.all(cpPromises)

    log('branch sync complete')
  }

  if (isChangesBlank) {
    log('changes branch is blank, creating new one')
    await ch.branch.write.rm()
    assert('branch' in ch.scope)
    await mw.branch.write.fork({ path: ch.scope.branch.join('/') })
    log('new changes branch created')
    return
  }
  const mwConfig = await mw.files.read.json(CONFIG_PATH, configSchema)
  ch.files.write.json(CONFIG_PATH, mwConfig)

  log('commiting ch branch')
  assert(isCommitScope(mw.scope))
  const merged = await ch.branch.write.commit('synced', mw.scope)
  if (merged === ch) {
    log('no changes to changes branch')
    return
  }

  log('ch commit complete')
  const diff = await merged.shards.read.diff({ other: mw.scope })
  log('post merge diff', diff)
}

async function isChangesSynced(mw: Artifact, ch: Artifact): Promise<boolean> {
  // TODO not sure if this is accurate ???
  const chCommit = await ch.branch.read.commit()
  assert(isCommitScope(mw.scope))
  if (chCommit.parent.length === 1) {
    return false
  }
  if (chCommit.parent.includes(mw.scope.commit)) {
    return true
  }
  return false
}

async function trackProgress() {
  while (limit.pendingCount > limit.concurrency) {
    log('pending count', limit.pendingCount)
    await delay(400)
  }
}
