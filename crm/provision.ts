// deno-lint-ignore-file no-console
import equal from 'fast-deep-equal'
import { createWebArtifact } from '@artifact/client'
import type { Artifact } from '@artifact/client/api'
import {
  type Config,
  CONFIG_PATH,
  type WatchMoneyworksConfig,
} from './types.ts'
import { generateMachineToken } from '@artifact/server/jwts'
export const provision = async (
  config: WatchMoneyworksConfig,
  startFrom = 0,
  artifact?: Artifact,
) => {
  const { artifactServer } = config
  const { artifactRepo = 'hamr' } = config
  const identity = 'did:example:artifact-tests'
  // TODO have to insert this token in the repo somehow
  if (!artifact) {
    const token = await generateMachineToken(artifactRepo)
    artifact = await createWebArtifact(artifactServer, identity, token)
  }

  const superRepos = await artifact.super.ls()
  const [home] = superRepos
  if (!home) {
    throw new Error('No repos found')
  }
  // TODO add a artifact.super.home()
  // tree.ls should return scopes, the same as what superLs does.
  artifact = artifact.checkout(home)
  const repos = await artifact.tree.ls()
  const repo = repos.find((repo) => repo.name === artifactRepo)
  if (!repo) {
    console.log('initializing artifact repo', artifactRepo)
    artifact = await artifact.tree.init(artifactRepo)
  } else {
    artifact = artifact.checkout({ repo: repo.name })
  }

  artifact = await artifact.repo.branches.default()
  artifact = await artifact.checkout({
    branch: config.moneyworksBranch,
  })
    .exists()

  if (!('commit' in artifact.scope)) {
    artifact = await artifact.repo.branches.default()
    artifact = await artifact.branch.write.fork({
      path: config.moneyworksBranch,
    })
  }
  artifact = await artifact.latest()

  const mwConfig: Config = { tables: {} }
  for (const table of config.tables) {
    mwConfig.tables[table] = startFrom
  }

  let existingConfig
  if (await artifact.files.read.exists(CONFIG_PATH)) {
    existingConfig = await artifact.files.read.json(CONFIG_PATH)
  }
  if (!equal(existingConfig, mwConfig)) {
    artifact.files.write.json(CONFIG_PATH, mwConfig)
    artifact = await artifact.branch.write.commit('Initial moneyworks config')
  }

  const prior = artifact
  artifact = await artifact.checkout({
    branch: config.changesBranch,
  }).exists()

  if (!('commit' in artifact.scope)) {
    artifact = await prior.branch.write.fork({
      path: config.changesBranch,
    })
    for (const file of await artifact.files.read.ls()) {
      artifact.files.write.rm(file.path)
    }
    artifact = await artifact.branch.write.commit('Initial changes branch')
  }
  return artifact
}
