import 'global-jsdom/register'
import { act, renderHook, waitFor } from 'npm:@testing-library/react@16.0.1'
import { expect } from '@std/expect'
import {
  type ChatTransport,
  createUIMessageStream,
  type UIDataTypes,
  type UIMessage,
  type UIMessageStreamPart,
} from 'ai'
import { useChat } from '@ai-sdk/react'

Deno.test('useChat handles simple exchange', async () => {
  const transport = {
    async sendMessages(
      { messages }: { messages: UIMessage[] },
    ): Promise<ReadableStream<UIMessageStreamPart>> {
      const last = messages[messages.length - 1]
      const userText =
        (last?.parts?.[0] as { text?: string } | undefined)?.text ?? ''
      return createUIMessageStream({
        execute(writer) {
          writer.write({ type: 'start' })
          writer.write({ type: 'text', text: `Echo: ${userText}` })
          writer.write({ type: 'finish' })
        },
      })
    },
    async reconnectToStream(): Promise<
      ReadableStream<UIMessageStreamPart> | null
    > {
      return null
    },
  } as any
  const { result } = renderHook(() => useChat({ transport }))

  await act(async () => {
    await result.current.sendMessage('hello')
  })

  await waitFor(() => expect(result.current.messages.length).toBe(2))

  const assistant = result.current.messages[1]
  expect(assistant.role).toBe('assistant')
  expect(assistant.parts[0]?.type).toBe('text')
  expect(assistant.parts[0]?.text).toBe('Echo: hello')
})
