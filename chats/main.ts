import { ulid } from 'ulid'
import type { Implementations } from '@artifact/client/api'
import { z } from '@artifact/client/zod'
import { useArtifact } from '@artifact/client/server'
import schema from './schema.ts'
import {
  assistantModelMessageSchema,
  // DefaultChatTransport,
  streamText,
  systemModelMessageSchema,
  toolModelMessageSchema,
  userModelMessageSchema,
} from 'ai'
// message will always be one of these types, as well as:
// 1. a config message, which represents model settings for the call
// 2. transcludes, which represent bundles of context

import { openai } from '@ai-sdk/openai'
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

export const infer: Tools['infer'] = () => {
  const { textStream, usage, totalUsage } = streamText({
    model: openai.responses('o3-pro'),
    prompt: 'Write a poem about embedding models.',
  })
  return textStream

  // consume it as quickly as possible
  // relay it down to a pushable so the client can error but the stream will
  // finish
  // when completed, save the final message to the disk
}

export default schema
