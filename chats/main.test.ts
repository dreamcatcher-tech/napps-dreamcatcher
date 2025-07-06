import { expectTypeOf } from 'expect-type'
import { expect } from '@std/expect'
import { deleteChat, infer, newChat } from './main.ts'
import schema from './schema.ts'
import { harness } from '@artifact/server/harness'
Deno.test('creates a new chat', async () => {
  await using fixtures = await harness({
    isolation: 'none',
    overrides: {
      '@dreamcatcher/chats': { default: schema, newChat, deleteChat, infer },
    },
  })
  let { artifact } = fixtures

  const fns = artifact.fibers.actions.bind(schema)

  const chat = await fns.newChat({ config: { model: 'test' } })
  expectTypeOf(chat.chatId).toBeString()

  artifact = await artifact.latest()
  const config = await artifact.files.read.json(
    `chats/${chat.chatId}/config.json`,
  ) as { model: string }

  expect(config).toBeDefined()
  expect(config.model).toBe('test')

  const chat2 = await fns.newChat({ config: { model: 'test' } })
  expectTypeOf(chat2.chatId).toBeString()
  expect(chat2.chatId).not.toBe(chat.chatId)

  const deleted = await fns.deleteChat({ chatId: chat.chatId })
  expect(deleted.deleted).toBe(true)

  const deleted2 = await fns.deleteChat({ chatId: chat.chatId })
  expect(deleted2.deleted).toBe(false)

  const deleted3 = await fns.deleteChat({ chatId: chat2.chatId })
  expect(deleted3.deleted).toBe(true)
})
