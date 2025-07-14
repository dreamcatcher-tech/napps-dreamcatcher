import '@std/dotenv/load'
import 'global-jsdom/register'
import { act, renderHook, waitFor } from '@testing-library/react'
import { expect } from '@std/expect'
import {
  type ChatTransport,
  convertToModelMessages,
  createUIMessageStream,
  streamText,
  type TextPart,
  type UIDataTypes,
  type UIMessage,
  UIMessageChunk,
} from 'ai'
import { useChat } from '@ai-sdk/react'
import { harness } from '@artifact/server/harness'
import { opts } from './main.test.ts'
import schema from './schema.ts'
import transport from './transport.ts'
// Deno.test('useChat handles mock exchange', async () => {
//   const transport = {
//     async sendMessages(
//       { messages }: { messages: UIMessage[] },
//     ): Promise<ReadableStream<UIMessageStreamPart>> {
//       const last = messages[messages.length - 1]
//       const userText =
//         (last?.parts?.[0] as { text?: string } | undefined)?.text ?? ''
//       return createUIMessageStream({
//         execute(writer) {
//           writer.write({ type: 'start' })
//           writer.write({ type: 'text', text: `Echo: ${userText}` })
//           writer.write({ type: 'finish' })
//         },
//       })
//     },
//     async reconnectToStream(): Promise<
//       ReadableStream<UIMessageStreamPart> | null
//     > {
//       return null
//     },
//   } as any
//   const { result } = renderHook(() => useChat({ transport }))

//   await act(async () => await result.current.sendMessage({ text: 'hello' }))

//   await waitFor(() => expect(result.current.messages.length).toBe(2))

//   const assistant = result.current.messages[1]!
//   expect(assistant.role).toBe('assistant')
//   expect(assistant.parts[0]!.type).toBe('text')
//   expect((assistant.parts[0]! as TextPart).text).toBe('Echo: hello')
// })

import { openai } from '@ai-sdk/openai'

// type ChatTransport

Deno.test('useChat with direct stream', async () => {
  const transport: ChatTransport<UIMessage> = {
    async sendMessages({ messages }) {
      // pop the last message
      // check it is a user message
      // send this to the server along with the generate request

      console.log('server start', messages)
      let out
      const result = streamText({
        model: openai('o4-mini'),
        seed: 1337,
        providerOptions: {
          openai: {
            reasoningSummary: 'detailed',
            reasoningEffort: 'high',
          },
        },
        messages: convertToModelMessages(messages),
        onError(error) {
          console.error('server', error)
          throw error // TODO use a pushable and push the error to the client
        },
        onFinish(output) {
          console.log('server finish', output)
          out = output
        },
      })
      result.consumeStream({
        onError: (error) => {
          console.error('server', error)
        },
      }).then(() => {
        console.log('server done', out!)
      })
      return result.toUIMessageStream({
        generateMessageId: () => '1',
        sendReasoning: true,
        sendSources: true,
      })
    },
    async reconnectToStream(): Promise<
      ReadableStream<UIMessageChunk> | null
    > {
      return null
    },
  }

  const { result } = renderHook(() =>
    useChat({
      transport,
      onFinish: (output) => {
        console.log('client finish', output)
      },
    })
  )

  await act(async () => {
    await result.current.sendMessage({
      text: 'Respond with cheeseburger emoji',
    })
  })
  console.log('client status', result.current.status)
  console.log('client error', result.current.error)
  console.log('client messages')
  console.dir(result.current.messages, { depth: null })
  await waitFor(() => expect(result.current.status).toBe('ready'))

  await waitFor(() => expect(result.current.messages.length).toBe(2))

  const assistant = result.current.messages[1]!
  expect(assistant.role).toBe('assistant')
  expect(assistant.id).toBe('1')
  expect(assistant.parts.length).toBe(3)
  expect(assistant.parts[2]!.type).toBe('text')
  expect((assistant.parts[2]! as TextPart).text).toContain('🍔')
})
Deno.test('useChat with artifact stream', async () => {
  await using fixtures = await harness(opts)
  let { artifact } = fixtures

  const fns = artifact.fibers.actions.bind(schema)

  const { chatId } = await fns.newChat({
    config: { model: 'gpt-4.1-nano', provider: 'openai' },
  })

  const { result } = renderHook(() =>
    useChat({ transport: transport(fns.generateText), id: chatId })
  )

  await act(async () => {
    await result.current.sendMessage({
      text: 'Respond with cheeseburger emoji',
    })
  })
  await waitFor(() => expect(result.current.status).toBe('ready'))

  await waitFor(() => expect(result.current.messages.length).toBe(2))

  const assistant = result.current.messages[1]!
  expect(assistant.role).toBe('assistant')
  expect(assistant.parts).toHaveLength(2)
  expect(assistant.parts[1]!.type).toBe('text')
  expect((assistant.parts[1]! as TextPart).text).toContain('🍔')

  artifact = await artifact.latest()
  const messages = await artifact.files.read.ls(`chats/${chatId}/messages`)
  expect(messages.length).toBe(2)
})
