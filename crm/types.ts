import { z } from '@artifact/client/zod'
import { jsonSchema } from '@artifact/client/api'

export const tablesSchema = z.enum(['Name', 'Transaction'])
export type Tables = z.infer<typeof tablesSchema>

export const configSchema = z.object({
  /** The list of tables to poll for changes on, as well as the last modified
   * time of the latest item we received from the table, or -1 if nothing has
   * been received yet */
  tables: z.record(tablesSchema, z.number().default(0)),
})

export type Config = z.infer<typeof configSchema>

export const CONFIG_PATH = 'config.json'

export const watchMoneyworksConfig = z.object({
  moneyworksServer: z.string().url(),
  artifactServer: z.string().url(),
  artifactRepo: z.string().optional(),
  moneyworksBranch: z.string().default('moneyworks'),
  changesBranch: z.string().default('changes'),
  pollingInterval: z
    .number()
    .min(10_000, 'Polling interval must be at least 10 seconds'),
  tables: z.array(tablesSchema).min(1),
})

export type WatchMoneyworksConfig = z.infer<typeof watchMoneyworksConfig>

export const moneyworksRecordSchema = z.object({
  id: z.string(),
  json: z.record(z.string(), jsonSchema),
  lastModified: z.number(),
})

export type MoneyworksRecord = z.infer<typeof moneyworksRecordSchema>

export const TABLE_TO_PK = {
  Transaction: 'namecode',
  Name: 'code',
}
