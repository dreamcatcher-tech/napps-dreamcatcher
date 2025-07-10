import { expectTypeOf } from 'expect-type'
import { expect } from '@std/expect'
import { addMessage, deleteChat, generateText, newChat } from './main.ts'
import schema from './schema.ts'
import { harness } from '@artifact/server/harness'
import '@std/dotenv/load'
import type { AssistantModelMessage, TextPart } from 'ai'

const opts = {
  isolation: 'asyncLocalStorage' as const,
  overrides: {
    '@dreamcatcher/chats': {
      default: schema,
      newChat,
      deleteChat,
      generateText,
      addMessage,
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

  await fns.addMessage({ chatId, content: 'Respond with cheeseburger emoji' })

  const stream = fns.generateText({ chatId })
  for await (const _ of stream) {
  }

  artifact = await artifact.latest()
  const messages = await artifact.files.read.ls(`chats/${chatId}/messages`)
  expect(messages.length).toBe(2)
  const message = await artifact.files.read.json(
    `chats/${chatId}/messages/${messages[1]!.path}`,
  ) as AssistantModelMessage
  expect(message.content).toHaveLength(1)
  const text = message.content[0]! as TextPart
  expect(text.type).toBe('text')
  expect(text.text).toContain('🍔')
})
