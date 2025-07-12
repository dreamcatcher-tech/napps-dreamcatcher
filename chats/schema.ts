import { z } from '@artifact/client/zod'

export const configSchema: Config = z.object({
  provider: z.enum(['openai', 'xai']),
  model: z.string(),
})

export type Config = z.ZodObject<{
  model: z.ZodString
  provider: z.ZodEnum<['openai', 'xai']>
}>

export default {
  name: '@dreamcatcher/chats',
  tools: {
    newChat: {
      parameters: z.object({ config: configSchema }),
      returns: z.object({
        chatId: z.string(),
      }),
    },
    updateConfig: {
      parameters: z.object({ chatId: z.string(), config: configSchema }),
      returns: z.void(),
    },
    deleteChat: {
      parameters: z.object({ chatId: z.string() }),
      returns: z.object({ deleted: z.boolean() }),
    },

    generateText: {
      parameters: z.object({
        chatId: z.string(),
        message: z.object({
          id: z.string(),
          role: z.literal('user'),
          parts: z.array(
            z.object({ type: z.literal('text'), text: z.string() }),
          ),
        }),
      }),
      stream: z.unknown(),
    },
    generateImage: {
      parameters: z.object({ chatId: z.string() }),
      stream: z.string(),
    },
    generateTranscript: {
      parameters: z.object({ chatId: z.string() }),
      stream: z.string(),
    },
  },
} as NappShape

type NappShape = {
  name: '@dreamcatcher/chats'
  tools: {
    newChat: {
      parameters: z.ZodObject<{
        config: Config
      }>
      returns: z.ZodObject<{
        chatId: z.ZodString
      }>
    }
    updateConfig: {
      parameters: z.ZodObject<
        { chatId: z.ZodString; config: Config }
      >
      returns: z.ZodVoid
    }
    deleteChat: {
      parameters: z.ZodObject<{
        chatId: z.ZodString
      }>
      returns: z.ZodObject<{
        deleted: z.ZodBoolean
      }>
    }

    generateText: {
      parameters: z.ZodObject<
        {
          chatId: z.ZodString
          message: z.ZodObject<
            {
              id: z.ZodString
              role: z.ZodLiteral<'user'>
              parts: z.ZodArray<
                z.ZodObject<{ type: z.ZodLiteral<'text'>; text: z.ZodString }>
              >
            }
          >
        }
      >
      stream: z.ZodUnknown
    }
    generateImage: {
      parameters: z.ZodObject<{ chatId: z.ZodString }>
      stream: z.ZodString
    }
    generateTranscript: {
      parameters: z.ZodObject<{ chatId: z.ZodString }>
      stream: z.ZodString
    }
  }
}
