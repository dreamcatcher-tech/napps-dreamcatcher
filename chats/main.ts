import type { Implementations } from '@artifact/client/tools'
import type schema from './schema.ts'
import { pushable } from 'it-pushable'
type Tools = Implementations<typeof schema>

export const newChat: Tools['newChat'] = async ({ config }) => {
  console.log(config)
  return {
    chatId: '123',
  }
}

export const infer: Tools['infer'] = () => {
  const stream = pushable<string>({ objectMode: true })
  stream.push('123')
  stream.push('456')
  stream.push('789')
  stream.end()
  return stream
}
