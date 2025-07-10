import { ulid } from 'ulid'
import type { z } from '@artifact/client/zod'
import {
  type Artifact,
  type Implementations,
  isRepoScope,
  type Meta,
} from '@artifact/client/api'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { configSchema } from './schema.ts'
import { useArtifact } from '@artifact/client/server'
import schema from './schema.ts'
import {
  type AssistantModelMessage,
  type LanguageModel,
  modelMessageSchema,
  type ProviderOptions,
  streamText,
  type UserModelMessage,
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

export const addMessage: Tools['addMessage'] = async ({ chatId, content }) => {
  return _addMessage(chatId, { role: 'user', content })
}

export const generateText: Tools['generateText'] = async function* (
  { chatId },
) {
  const artifact = useArtifact()
  const messagesPath = `chats/${chatId}/messages`
  const messages = await loadMessages(artifact, messagesPath)

  const configJson = await artifact.files.read.json(
    `chats/${chatId}/config.json`,
  )
  const config = configSchema.parse(configJson)

  const { model, providerOptions } = getProvider(config)

  const {
    fullStream,
    content,
  } = streamText({
    model,
    seed: 1337,
    providerOptions,
    messages,
    onError(error) {
      throw error // TODO use a pushable and push the error to the client
    },
    toolCallStreaming: true,
  })

  // consumeStream() // TODO consume the stream, but tolerate the client
  // detaching

  yield* fullStream

  const contentResult = await content as any // TODO use a specific type
  await _addMessage(chatId, { role: 'assistant', content: contentResult })
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

const loadMessages = async (artifact: Artifact, messagesPath: string) => {
  const messageNames = await artifact.files.read.ls(messagesPath)
  const messages = await Promise.all(messageNames.map(async ({ path }) => {
    const data = await artifact.files.read.json(messagesPath + '/' + path)
    return modelMessageSchema.parse(data)
  }))
  return messages
}

const getProvider = (config: z.infer<typeof configSchema>): {
  model: LanguageModel
  providerOptions: ProviderOptions
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
        providerOptions: {},
      }
    }
    return {
      model: xai(config.model),
      providerOptions: {
        xai: {
          reasoningEffort: 'high',
        },
      },
    }
  }
  throw new Error('Invalid provider: ' + config.provider)
}

const _addMessage = async (
  chatId: string,
  message: UserModelMessage | AssistantModelMessage,
) => {
  let artifact = useArtifact()
  artifact = await artifact.latest()
  assert(isRepoScope(artifact.scope))
  const { repo } = artifact.scope
  const messageNames = await artifact.files.read.ls(`chats/${chatId}/messages`)
  const index = getNextMessageIndex(messageNames) + ''
  const filename = index.padStart(6, '0')
  const path = `chats/${chatId}/messages/${filename}-${repo}.json`

  artifact.files.write.text(path, JSON.stringify(message, null, 2))
  await artifact.branch.write.commit('add message: ' + chatId + ' ' + index)
}

export default schema

// TODO need a test where the client stops the stream part way thru, and yet we
// still finish the generation and the file is written to disk.
