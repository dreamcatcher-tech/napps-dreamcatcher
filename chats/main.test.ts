import { expect } from '@std/expect'
import { newChat } from './main.ts'

Deno.test('creates a new chat', async () => {
  // need to fire up an instance of artifact so the tests work

  const chat = await newChat({ config: 'test' })
  expect(chat.chatId).toBe('123')
})
