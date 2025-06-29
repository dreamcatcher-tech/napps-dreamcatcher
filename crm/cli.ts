// deno-lint-ignore-file no-console
import { Command } from 'commander'
import denoJson from './deno.json' with { type: 'json' }
import {
  clearEnvStorage,
  promptForEnvKeys,
  setEnvKey,
} from '@artifact/utils-server'
import { watchMoneyworksConfig } from './types.ts'
import { provision } from './provision.ts'
import { initialize } from './initialize-moneyworks.ts'
import { reconcile } from './reconcile.ts'
import { watch } from './watch.ts'
import { load } from '@std/dotenv'
import Debug from 'debug'
Debug.enable('crm:*')

await load({ export: true })

const requiredEnvKeys = [
  { key: 'MONEYWORKS_SECURE_URL', friendlyName: 'MoneyWorks Secure URL' },
  { key: 'ARTIFACT_SERVER_URL', friendlyName: 'Artifact Server URL' },
  { key: 'ARTIFACT_KEY', friendlyName: 'Artifact Key' },
  { key: 'ARTIFACT_REPO', friendlyName: 'Artifact Repo' },
]

function parseTimeSpec(input: string): number {
  if (!input || input === 'now') {
    return Date.now()
  }
  if (input === 'forever') {
    return 0 // earliest possible
  }
  const match = input.match(/^(\d+)([hdm])$/)
  if (!match) {
    throw new Error(`Invalid time: ${input}. Use "now", "1h", "2d", etc.`)
  }
  const count = Number(match[1])
  const unit = match[2]
  switch (unit) {
    case 'h':
      return Date.now() - count * 3600_000
    case 'd':
      return Date.now() - count * 86400_000
    case 'm':
      return Date.now() - count * 60_000
  }
  throw new Error(`Invalid time: ${input}`)
}

const program = new Command()

program
  .name('moneyworks-sync')
  .description(
    `Continuously polls MoneyWorks for new/updated records, commits them to a \`moneyworks\` branch, and monitors a \`changes\` branch to apply edits back into MoneyWorks for full two-way sync.`,
  )
  .version(denoJson.version)
  .option('--clear', 'Clear stored environment variables')
  .option('--provision', 'Provision moneyworks repository on artifact')
  .option('--watch', 'Continuously watch for changes')
  .option(
    '--since [time]',
    'Set the "last modified" start time, e.g. "1h", "2d"',
  )
  .option('--since-forever', 'Fetch everything from earliest time.')
  .action(async (options) => {
    if (options.clear) {
      clearEnvStorage()
      console.log('Cleared stored environment variables')
      return
    }

    if (options.since && options.sinceForever) {
      throw new Error('Cannot specify both --since and --since-forever')
    }

    await promptForEnvKeys(requiredEnvKeys)

    // Build config from environment
    const moneyworksServer = Deno.env.get('MONEYWORKS_SECURE_URL')
    const artifactServer = Deno.env.get('ARTIFACT_SERVER_URL')
    const artifactKey = Deno.env.get('ARTIFACT_KEY')
    const artifactRepo = Deno.env.get('ARTIFACT_REPO')
    validateEnvironmentVariables(
      moneyworksServer,
      artifactServer,
      artifactKey,
      artifactRepo,
    )

    const config = watchMoneyworksConfig.parse({
      moneyworksServer,
      artifactServer,
      artifactKey,
      artifactRepo,
      moneyworksBranch: ['moneyworks'],
      changesBranch: ['changes'],
      pollingInterval: 10_000,
      tables: ['Name', 'Transaction'],
    })

    let sinceTime: number | undefined
    if (options.sinceForever) {
      sinceTime = 0
    } else if (options.since) {
      sinceTime = parseTimeSpec(options.since.trim())
    } else {
      sinceTime = parseTimeSpec('3d')
    }
    console.log('provisioning sinceTime', new Date(sinceTime).toLocaleString())
    const artifact = await provision(config, sinceTime)

    if (options.provision) {
      const artifact = await provision(config)
      console.log('provisioned')
      if (!('repo' in artifact.scope)) {
        throw new Error('Failed to provision artifact')
      }
      console.log('setting ARTIFACT_REPO', artifact.scope.repo)
      setEnvKey('ARTIFACT_REPO', artifact.scope.repo)

      return
    }

    console.log('initializing moneyworks')
    const moneyworks = await initialize(config)

    if (options.watch) {
      await watch(config, artifact, moneyworks)
    } else {
      await reconcile(config, artifact, moneyworks)
      console.log('Done.')
    }
  })

program.parse(Deno.args, { from: 'user' })

function validateEnvironmentVariables(
  moneyworksServer: string | undefined,
  artifactServer: string | undefined,
  artifactKey: string | undefined,
  artifactRepo: string | undefined,
  isProvisioning = false,
): void {
  if (!moneyworksServer) {
    throw new Error('MONEYWORKS_SECURE_URL is not set')
  }
  if (!artifactServer) {
    throw new Error('ARTIFACT_SERVER_URL is not set')
  }
  if (!artifactKey) {
    throw new Error('ARTIFACT_KEY is not set')
  }
  if (!isProvisioning && !artifactRepo) {
    throw new Error('ARTIFACT_REPO is not set')
  }

  try {
    new URL(moneyworksServer)
  } catch {
    throw new Error('MONEYWORKS_SECURE_URL must be a valid URL')
  }

  try {
    new URL(artifactServer)
  } catch {
    throw new Error('ARTIFACT_SERVER_URL must be a valid URL')
  }

  if (!/^[0-9a-fA-F]{64}$/.test(artifactKey)) {
    throw new Error('ARTIFACT_KEY must be a 64-character hexadecimal string')
  }

  if (artifactRepo && (artifactRepo.length < 3 || /\s/.test(artifactRepo))) {
    throw new Error(
      'ARTIFACT_REPO must be at least 3 characters long and contain no spaces',
    )
  }
}
