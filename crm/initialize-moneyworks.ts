import { MoneyworksServer } from './moneyworks-server.ts'
import type { WatchMoneyworksConfig } from './types.ts'

export async function initialize(config: WatchMoneyworksConfig) {
  if (!config.tables.length) {
    throw new Error('No tables specified')
  }

  const moneyworks = MoneyworksServer.create(config.moneyworksServer)

  const check = await moneyworks.check()

  if (!check) {
    throw new Error('MoneyWorks server check failed.')
  }

  return moneyworks
}
