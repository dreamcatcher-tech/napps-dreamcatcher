import type { Implementations } from '@artifact/client/tools'
import type schema from './schema.ts'
import { pushable } from 'it-pushable'
type Tools = Implementations<typeof schema>

export const newChat: Tools['newChat'] = async ({ config }) => {
  // config can be used here for initialization
  return {
    chatId: '123',
  }
}

export const infer: Tools['infer'] = () => {
  // const { text } = await generateText({
  //   model: openai('o3-mini'),
  //   prompt: 'What is love?',
  // })

  const stream = pushable<string>({ objectMode: true })
  stream.push('123')
  stream.push('456')
  stream.push('789')
  stream.end()
  return stream
}
