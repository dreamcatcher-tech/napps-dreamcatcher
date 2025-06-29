import type { Implementations } from '@artifact/client/tools'
import type schema from './schema.ts'
import { pushable } from 'it-pushable'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
type Tools = Implementations<typeof schema>

export const newChat: Tools['newChat'] = async ({ config }) => {
  console.log(config)
  return {
    chatId: '123',
  }
}

export const infer: Tools['infer'] = () => {
  const { textStream, usage, totalUsage } = streamText({
    model: openai('gpt-4.1'),
    prompt: 'Write a poem about embedding models.',
  })
  return textStream

  // consume it as quickly as possible
  // relay it down to a pushable so the client can error but the stream will
  // finish
  // when completed, save the final message to the disk
}
