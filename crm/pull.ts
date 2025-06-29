import type { Artifact } from '@artifact/client/api'
import type { MoneyworksRecord } from './types.ts'
import type { MoneyworksServer } from './moneyworks-server.ts'
import { parseXmlRecords } from './moneyworks-parser.ts'
import { assert } from '@std/assert'
import { CONFIG_PATH, configSchema, TABLE_TO_PK } from './types.ts'
import Debug from 'debug'

const log = Debug('crm:pull')

const BATCH_SIZE = 100

export const pull = async (
  server: MoneyworksServer,
  table: keyof typeof TABLE_TO_PK,
  mw: Artifact,
) => {
  log('starting pull:', table)
  mw = await mw.latest()

  const config = await safeConfig(mw)
  const lastModifiedTime = config.tables[table]

  const xmlData = await server.exportTable(table, lastModifiedTime)
  const pk = TABLE_TO_PK[table]
  const pulledRecords = parseXmlRecords(xmlData, pk)
  log('pulledRecords:', pulledRecords.map((r) => r.id), 'for:', table)
  if (pulledRecords.length === 0) {
    return mw
  }

  return await update(mw, table, pulledRecords)
}

async function update(
  mw: Artifact,
  table: keyof typeof TABLE_TO_PK,
  records: MoneyworksRecord[],
) {
  records.sort((a, b) => a.lastModified - b.lastModified)
  assert(records[0], 'No records to update')
  let lastModifiedTime = records[0].lastModified

  mw = await mw.branch.read.latest()

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    for (const rec of batch) {
      const path = `${table}/${rec.id}.json`
      mw.shards.write.json(path, rec)
      if (rec.lastModified > lastModifiedTime) {
        lastModifiedTime = rec.lastModified
      }
    }

    const config = await safeConfig(mw)
    config.tables[table] = lastModifiedTime
    mw.files.write.json(CONFIG_PATH, config)

    const msg = `Pulled ${batch.length} records for ${table}`
    // TODO should have a progress callback
    const committed = await mw.branch.write.commit(msg)
    if (committed === mw) {
      log('No different records detected')
    }
    log('commit complete:', msg)
    mw = committed
  }

  return mw
}

async function safeConfig(artifact: Artifact) {
  try {
    return await artifact.files.read.json(CONFIG_PATH, configSchema)
  } catch {
    return configSchema.parse({ tables: {} })
  }
}
