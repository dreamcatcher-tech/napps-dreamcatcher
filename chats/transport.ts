import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai'
import schema from './schema.ts'

type GenerateTextParams = {
  chatId: string
  message: {
    id: string
    role: 'user'
    parts: {
      type: 'text'
      text: string
    }[]
  }
}

export default function transport(
  generateText: (
    params: GenerateTextParams,
  ) => AsyncIterable<unknown>,
): ChatTransport<UIMessage> {
  const transport: ChatTransport<UIMessage> = {
    async sendMessages(
      { messages, chatId }: { messages: UIMessage[]; chatId: string },
    ): Promise<ReadableStream<UIMessageChunk>> {
      const params = schema.tools.generateText.parameters.parse(
        { chatId, message: messages[messages.length - 1] },
      )
      const stream = generateText(params) as AsyncIterable<UIMessageChunk>
      return asyncIterableToReadableStream(stream)
    },
    async reconnectToStream(): Promise<
      ReadableStream<UIMessageChunk> | null
    > {
      // deno-lint-ignore no-console
      console.log('reconnectToStream')
      return null
    },
  }
  return transport
}

function asyncIterableToReadableStream(asyncIterable: AsyncIterable<unknown>) {
  const iterator = asyncIterable[Symbol.asyncIterator]()
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next()
        if (done) {
          controller.close()
        } else {
          controller.enqueue(value)
        }
      } catch (error) {
        controller.error(error)
      }
    },
    async cancel(reason) {
      // Optionally handle cancellation if the iterable supports it
      if (typeof iterator.return === 'function') {
        await iterator.return(reason)
      }
    },
  })
}
