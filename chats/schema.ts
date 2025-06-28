import { z } from '@artifact/client/zod'

export default {
  name: '@dreamcatcher/chats',
  tools: {
    newChat: {
      parameters: z.object({ config: z.string() }),
      returns: z.object({
        chatId: z.string(),
      }),
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
        config: z.ZodString
      }>
      returns: z.ZodObject<{
        chatId: z.ZodString
      }>
    }
    infer: {
      parameters: z.ZodObject<{}>
      stream: z.ZodString
    }
  }
}
