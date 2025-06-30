import { assert } from '@std/assert'
import { expect } from '@std/expect'
import { setupMockServer } from './mock.ts'
import { provision } from './provision.ts'
import type { WatchMoneyworksConfig } from './types.ts'
import { reconcile } from './reconcile.ts'
import type { CommitScope } from '@artifact/client/api'
import { createMockArtifact } from '@artifact/client/mock'

async function setup() {
  const { mwServer, mockData } = setupMockServer()
  const repoName = `mw-sync-test-${crypto.randomUUID().slice(0, 6)}`
  const config: WatchMoneyworksConfig = {
    moneyworksServer: 'http://mockserver/MockDoc',
    artifactServer: 'http://fake-artifact.com',
    artifactRepo: repoName,
    moneyworksBranch: 'moneyworks',
    changesBranch: 'changes',
    pollingInterval: 10000,
    tables: ['Name'],
  }

  const artifact = createMockArtifact()

  return { mwServer, mockData, config, artifact }
}

Deno.test(
  {
    name:
      'reconcile is idempotent - calling it multiple times with no changes has no effect',
  },
  async () => {
    const fixtures = await setup()
    let { mwServer, mockData, config, artifact } = fixtures
    const table = config.tables[0]
    assert(table)

    // Setup initial state with some data
    mockData.set('Name', [{
      id: 'TEST-IDEMPOTENT-001',
      lastModified: Date.UTC(2025, 0, 1, 12, 0, 0),
      json: {
        code: 'TEST-IDEMPOTENT-001',
        lastmodifiedtime: '20250101120000',
        name: 'TestIdempotency',
      },
    }])

    artifact = await provision(config, 0, artifact)

    // First reconcile to get initial state
    await reconcile(config, artifact, mwServer)

    // Capture state after first reconcile
    const mwBefore = await artifact
      .checkout({ branch: config.moneyworksBranch })
      .latest()
    const chBefore = await artifact
      .checkout({ branch: config.changesBranch })
      .latest()

    // Call reconcile again with no changes
    await reconcile(config, artifact, mwServer)

    // Verify state hasn't changed
    const mwAfter = await artifact
      .checkout({ branch: config.moneyworksBranch })
      .latest()
    const chAfter = await artifact
      .checkout({ branch: config.changesBranch })
      .latest()

    expect((mwAfter.scope as CommitScope).commit).toEqual(
      (mwBefore.scope as CommitScope).commit,
    )
    expect((chAfter.scope as CommitScope).commit).toEqual(
      (chBefore.scope as CommitScope).commit,
    )

    // Call reconcile a third time to be extra sure
    await reconcile(config, artifact, mwServer)

    const mwFinal = await artifact
      .checkout({ branch: config.moneyworksBranch })
      .latest()
    const chFinal = await artifact
      .checkout({ branch: config.changesBranch })
      .latest()

    expect((mwFinal.scope as CommitScope).commit).toEqual(
      (mwBefore.scope as CommitScope).commit,
    )
    expect((chFinal.scope as CommitScope).commit).toEqual(
      (chBefore.scope as CommitScope).commit,
    )
  },
)
