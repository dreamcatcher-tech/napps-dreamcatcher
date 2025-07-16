import { ulid } from 'ulid'
import type { z } from '@artifact/client/zod'
import {
  type Artifact,
  type Implementations,
  isRepoScope,
  type Meta,
} from '@artifact/client/api'
import { openai, type OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import { xai, type XaiProviderOptions } from '@ai-sdk/xai'
import { configSchema } from './schema.ts'
import { useArtifact } from '@artifact/client/server'
import schema from './schema.ts'
import {
  convertToModelMessages,
  type LanguageModel,
  streamText,
  type UIMessage,
} from 'ai'
import { assert } from '@std/assert/assert'

type Tools = Implementations<typeof schema>

export const newChat: Tools['newChat'] = async ({ config }) => {
  const chatId = ulid()
  const filename = `chats/${chatId}/config.json`
  const artifact = useArtifact()

  artifact.files.write.json(filename, config)
  await artifact.branch.write.commit('new chat: ' + chatId)

  return { chatId }
}

export const deleteChat: Tools['deleteChat'] = async ({ chatId }) => {
  const artifact = useArtifact()
  const folder = `chats/${chatId}`
  if (await artifact.files.read.exists(folder)) {
    artifact.files.write.rm(folder)
    await artifact.branch.write.commit('delete chat: ' + chatId)
    return { deleted: true }
  }
  return { deleted: false }
}

export const generateText: Tools['generateText'] = async function* (
  { chatId, message },
) {
  const artifact = useArtifact()
  const messages = await loadMessages(artifact, chatId)
  messages.push(message)

  const configJson = await artifact.files.read.json(
    `chats/${chatId}/config.json`,
  )
  const config = configSchema.parse(configJson)

  const { model, providerOptions } = getProvider(config)

  const result = streamText({
    model,
    seed: 1337,
    providerOptions,
    messages: convertToModelMessages(messages), 
    onError(error) {
      console.error('streamText onError', error)
      throw error // TODO use a pushable and push the error to the client
    },
    onFinish: (output) => {
      console.log('streamText onFinish', output)
    }
  })
  let generations: UIMessage[] | undefined
  try {

    yield* result.toUIMessageStream({
      generateMessageId: () => ulid(),
      sendReasoning: true,
      sendSources: true,
      onFinish(output) {
        console.log('toUIMessageStream onFinish', output)
        generations = output.messages
      },
      onError: (error) => {
        console.error('toUIMessageStream onError', error)
        throw error
      }
    })
  } finally {
    console.log('finally')
  }
  await result.consumeStream({ onError: (error) => {
    console.error('onError', error)
    throw error
  }})

  if (!generations || generations.length === 0) {
    throw new Error('No output')
  }
  const lastMessage = generations[generations.length - 1]
  if (!lastMessage || lastMessage.role !== 'assistant') {
    throw new Error('No output')
  }
  await addMessages(chatId, [message, lastMessage])
}

const getNextMessageIndex = (messages: Meta[]) => {
  let highestIndex = -1
  for (const message of messages) {
    const prefix = message.path.split('-').shift() || ''
    try {
      const index = parseInt(prefix)
      if (index > highestIndex) {
        highestIndex = index
      }
    } catch {
      // ignore
    }
  }
  return highestIndex + 1
}

const loadMessages = async (artifact: Artifact, chatId: string) => {
  const chatPath = `chats/${chatId}`
  if (!(await artifact.files.read.exists(chatPath))) {
    throw new Error('Chat not found: ' + chatId)
  }

  const messagesPath = chatPath + '/messages'
  if (!(await artifact.files.read.exists(messagesPath))) {
    return []
  }

  const messageNames = await artifact.files.read.ls(messagesPath)
  const messages = await Promise.all(messageNames.map(async ({ path }) => {
    const data = await artifact.files.read.typed(
      messagesPath + '/' + path,
      (data: unknown) => data as UIMessage,
    )
    return data
  }))
  return messages
}

const getProvider = (config: z.infer<typeof configSchema>): {
  model: LanguageModel
  providerOptions: { openai: OpenAIResponsesProviderOptions } | { xai: XaiProviderOptions }
} => {
  if (config.provider === 'openai') {
    return {
      model: openai.responses(config.model),
      providerOptions: {
        openai: {
          reasoningSummary: 'detailed',
        },
      },
    }
  }
  if (config.provider === 'xai') {
    if (config.model === 'grok-4') {
      return {
        model: xai(config.model),
        providerOptions: {
          xai: {
            searchParameters: { mode: 'auto' },
          },
        },
      }
    }
    return {
      model: xai(config.model),
      providerOptions: {
        xai: {
          reasoningEffort: 'high',
          searchParameters: { mode: 'auto' },
        },
      },
    }
  }
  throw new Error('Invalid provider: ' + config.provider)
}

const addMessages = async (chatId: string, messages: UIMessage[]) => {
  let artifact = useArtifact()
  artifact = await artifact.latest()
  assert(isRepoScope(artifact.scope))
  const { repo } = artifact.scope
  const messageNames = await artifact.files.read.ls(`chats/${chatId}/messages`)
  let index = getNextMessageIndex(messageNames)

  for (const message of messages) {
    const prefix = index.toString().padStart(6, '0')
    index++
    const filename = `${prefix}-${repo}.json`
    const path = `chats/${chatId}/messages/${filename}`
    artifact.files.write.text(path, JSON.stringify(message, null, 2))
  }
  await artifact.branch.write.commit(
    `add ${messages.length} messages: ${chatId}`,
  )
}

export default schema

// TODO need a test where the client stops the stream part way thru, and yet we
// still finish the generation and the file is written to disk.
