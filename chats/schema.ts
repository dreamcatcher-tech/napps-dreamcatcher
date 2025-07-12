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
    deleteChat: {
      parameters: z.object({ chatId: z.string() }),
      returns: z.object({ deleted: z.boolean() }),
    },
    updateConfig: {
      parameters: z.object({ chatId: z.string(), config: configSchema }),
      returns: z.void(),
    },
    addMessage: {
      parameters: z.object({ chatId: z.string(), content: z.string() }),
      returns: z.object({
        messageId: z.string(),
      }),
    },
    generateText: {
      parameters: z.object({ chatId: z.string() }),
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
    deleteChat: {
      parameters: z.ZodObject<{
        chatId: z.ZodString
      }>
      returns: z.ZodObject<{
        deleted: z.ZodBoolean
      }>
    }
    updateConfig: {
      parameters: z.ZodObject<
        { chatId: z.ZodString; config: Config }
      >
      returns: z.ZodVoid
    }
    addMessage: {
      parameters: z.ZodObject<{ chatId: z.ZodString; content: z.ZodString }>
      returns: z.ZodObject<{
        messageId: z.ZodString
      }>
    }
    generateText: {
      parameters: z.ZodObject<{ chatId: z.ZodString }>
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
