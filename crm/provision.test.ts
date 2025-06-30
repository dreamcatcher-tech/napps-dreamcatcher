import { CONFIG_PATH } from './types.ts'
import { provision } from './provision.ts'
import type { WatchMoneyworksConfig } from './types.ts'
import { expect } from '@std/expect'
import { createMockArtifact } from '@artifact/client/mock'

const MONEYWORKS_SECURE_URL = 'http://fake-moneyworks.com'
const ARTIFACT_SERVER_URL = 'http://fake-artifact.com'
const ARTIFACT_REPO = 'test-provision'

Deno.test(
  {
    name: 'provision sets up branches',
  },
  async () => {
    const config: WatchMoneyworksConfig = {
      moneyworksServer: MONEYWORKS_SECURE_URL,
      artifactServer: ARTIFACT_SERVER_URL,
      artifactRepo: ARTIFACT_REPO,
      moneyworksBranch: 'moneyworks_test',
      changesBranch: 'changes_test',
      pollingInterval: 10000,
      tables: ['Name'],
    }

    let artifact = createMockArtifact()
    artifact = await provision(config, 0, artifact)
    expect(artifact).toBeDefined()

    // 1. Check artifact service
    await artifact.exists()

    // 2. checkout the moneyworks branch
    let mw = artifact.checkout({ branch: config.moneyworksBranch })
    expect(mw.scope).toHaveProperty('branch')
    expect(mw.scope).not.toHaveProperty('commit')

    mw = await mw.exists()

    expect(mw.scope).toHaveProperty('branch')
    expect(mw.scope).not.toHaveProperty('commit')

    mw = await mw.branch.read.latest()

    const configPresent = await mw.files.read.exists(CONFIG_PATH)
    expect(configPresent).toBeTruthy()
    const content = await mw.files.read.json(CONFIG_PATH)
    expect(content).toBeDefined()

    const ch = artifact.checkout({ branch: config.changesBranch })
    const chExists = await ch.exists()
    expect(chExists.scope).toHaveProperty('branch')
    expect(chExists.scope).not.toHaveProperty('commit')
  },
)
