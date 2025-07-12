import { expectTypeOf } from 'expect-type'
import { expect } from '@std/expect'
import { deleteChat, generateText, newChat } from './main.ts'
import schema from './schema.ts'
import { harness } from '@artifact/server/harness'
import '@std/dotenv/load'
import type { TextPart, UIMessage } from 'ai'

export const opts = {
  isolation: 'asyncLocalStorage' as const,
  overrides: {
    '@dreamcatcher/chats': {
      default: schema,
      newChat,
      deleteChat,
      generateText,
    },
  },
}

Deno.test('creates a new chat', async () => {
  await using fixtures = await harness(opts)
  let { artifact } = fixtures

  const fns = artifact.fibers.actions.bind(schema)

  const chat = await fns.newChat({
    config: { model: 'test', provider: 'openai' },
  })
  expectTypeOf(chat.chatId).toBeString()

  artifact = await artifact.latest()
  const config = await artifact.files.read.json(
    `chats/${chat.chatId}/config.json`,
  ) as { model: string }

  expect(config).toBeDefined()
  expect(config.model).toBe('test')

  const chat2 = await fns.newChat({
    config: { model: 'test', provider: 'openai' },
  })
  expectTypeOf(chat2.chatId).toBeString()
  expect(chat2.chatId).not.toBe(chat.chatId)

  const deleted = await fns.deleteChat({ chatId: chat.chatId })
  expect(deleted.deleted).toBe(true)

  const deleted2 = await fns.deleteChat({ chatId: chat.chatId })
  expect(deleted2.deleted).toBe(false)

  const deleted3 = await fns.deleteChat({ chatId: chat2.chatId })
  expect(deleted3.deleted).toBe(true)
})

Deno.test('generates text', async () => {
  await using fixtures = await harness(opts)
  let { artifact } = fixtures

  const fns = artifact.fibers.actions.bind(schema)

  const { chatId } = await fns.newChat({
    config: { model: 'gpt-4.1-nano', provider: 'openai' },
  })

  let stream = fns.generateText({
    chatId,
    message: {
      id: '1',
      role: 'user',
      parts: [{ type: 'text', text: 'Respond with cheeseburger emoji' }],
    },
  })
  for await (const _ of stream) {
    console.log('stream1', _)
  }

  artifact = await artifact.latest()
  let messages = await artifact.files.read.ls(`chats/${chatId}/messages`)
  expect(messages.length).toBe(2)
  let message = await artifact.files.read.typed(
    `chats/${chatId}/messages/${messages[1]!.path}`,
    (data: unknown) => data as UIMessage,
  )

  console.log('message', message)

  expect(message.parts).toHaveLength(2)
  let text = message.parts[1]! as TextPart
  expect(text.type).toBe('text')
  expect(text.text).toContain('🍔')

  stream = fns.generateText({
    chatId,
    message: {
      id: '2',
      role: 'user',
      parts: [{ type: 'text', text: 'respond with the same emoji again' }],
    },
  })
  for await (const _ of stream) {
    console.log('stream2', _)
  }

  artifact = await artifact.latest()
  messages = await artifact.files.read.ls(`chats/${chatId}/messages`)
  expect(messages.length).toBe(4)
  message = await artifact.files.read.typed(
    `chats/${chatId}/messages/${messages[3]!.path}`,
    (data: unknown) => data as UIMessage,
  )
  expect(message.parts).toHaveLength(2)
  text = message.parts[1]! as TextPart
  expect(text.type).toBe('text')
  expect(text.text).toContain('🍔')
})
