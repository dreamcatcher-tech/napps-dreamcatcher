import { CONFIG_PATH } from './types.ts'
import { provision } from './provision.ts'
import type { WatchMoneyworksConfig } from './types.ts'
import { expect } from '@std/expect'
import { createServer } from '@artifact/server/server'
import { generateTestToken } from '@artifact/server/jwts'

const MONEYWORKS_SECURE_URL = 'http://fake-moneyworks.com'
const ARTIFACT_SERVER_URL = 'http://fake-artifact.com'
const ARTIFACT_REPO = ''

const appId = 'test-app'

async function setup() {
  const { token, verificationKey } = await generateTestToken(appId)
  const server = createServer({ appId, verificationKey })
  const { app } = server

  const original = globalThis.fetch
  globalThis.fetch = (input, init) => Promise.resolve(app.request(input, init))

  return {
    app,
    token,
    [Symbol.dispose]: () => {
      globalThis.fetch = original
      server.close()
    },
  }
}

Deno.test(
  {
    name: 'provision sets up branches',
    ignore: true,
  },
  async () => {
    using _ = await setup()

    const config: WatchMoneyworksConfig = {
      moneyworksServer: MONEYWORKS_SECURE_URL,
      artifactServer: ARTIFACT_SERVER_URL,
      artifactRepo: ARTIFACT_REPO,
      moneyworksBranch: ['moneyworks_test'],
      changesBranch: ['changes_test'],
      pollingInterval: 10000,
      tables: ['Name'],
    }

    const artifact = await provision(config)
    expect(artifact).toBeDefined()

    // 1. Check artifact service
    await artifact.exists()

    // 2. checkout the moneyworks branch
    let mw = artifact.checkout({ branch: config.moneyworksBranch.join('/') })
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

    const ch = artifact.checkout({ branch: config.changesBranch.join('/') })
    const chExists = await ch.exists()
    expect(chExists.scope).toHaveProperty('branch')
    expect(chExists.scope).not.toHaveProperty('commit')
  },
)
