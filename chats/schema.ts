import { z } from '@artifact/client/zod'

export const configSchema = z.object({
  model: z.string(),
})

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

    infer: {
      parameters: z.object({}),
      stream: z.string(),
    },
  },
} as NappShape

type NappShape = {
  name: '@dreamcatcher/chats'
  tools: {
    newChat: {
      parameters: z.ZodObject<{
        config: z.ZodObject<{
          model: z.ZodString
        }>
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
    infer: {
      parameters: z.ZodObject<{}>
      stream: z.ZodString
    }
  }
}
