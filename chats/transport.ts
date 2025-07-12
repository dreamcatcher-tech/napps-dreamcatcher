import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai'
import schema, { type NappShape } from './schema.ts'

// parameters: z.object({
//     chatId: z.string(),
//     message: z.object({
//       id: z.string(),
//       role: z.literal('user'),
//       parts: z.array(
//         z.object({ type: z.literal('text'), text: z.string() }),
//       ),
//     }),
//   }),

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
        { chatId, message: messages[messages.length - 1]! },
      )
      const stream = generateText(params) as AsyncIterable<UIMessageChunk>
      return ReadableStream.from(stream)
    },
    async reconnectToStream(): Promise<
      ReadableStream<UIMessageChunk> | null
    > {
      return null
    },
  }
  return transport
}
