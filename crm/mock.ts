import { MoneyworksServer } from './moneyworks-server.ts'
import {
  parseMoneyworksTime,
  parseXmlRecords,
  stringifyXmlRecords,
} from './moneyworks-parser.ts'
import type { MoneyworksRecord } from './types.ts'

export function createMockDataStore() {
  return new Map<string, MoneyworksRecord[]>()
}

export function createMockFetch(mockData: Map<string, MoneyworksRecord[]>) {
  async function handleImport(init?: RequestInit): Promise<Response> {
    const xmlPayload = init?.body ? await new Response(init.body).text() : ''
    const tableMatch = xmlPayload.match(/<table name="([^"]+)"/)
    if (!tableMatch?.[1]) {
      return new Response('No table found', { status: 400 })
    }
    const table = tableMatch[1]
    const existing = mockData.get(table) ?? []
    const parsed = parseXmlRecords(xmlPayload, 'code')
    for (const rec of parsed) {
      const idx = existing.findIndex((e) => e.id === rec.id)
      if (idx >= 0) {
        existing[idx] = rec
      } else {
        existing.push(rec)
      }
    }
    mockData.set(table, existing)
    return new Response('OK', { status: 200 })
  }

  function handleExport(url: URL): Response {
    const table = url.searchParams.get('table') ?? ''
    const searchParam = url.searchParams.get('search') ?? ''
    const mwTime = searchParam.match(/\d{14}/)?.[0]
    const since = mwTime ? parseMoneyworksTime(mwTime) : 0
    const rows = mockData.get(table) ?? []
    const filtered = rows.filter((r) => r.lastModified >= since)
    const xmlOutput = stringifyXmlRecords(table, filtered)
    return new Response(xmlOutput, { status: 200 })
  }

  return function mockFetch(
    input: Request | string | URL,
    init?: RequestInit,
  ): Promise<Response> {
    let url: URL
    if (typeof input === 'string') {
      url = new URL(input)
    } else if (input instanceof URL) {
      url = input
    } else {
      url = new URL(input.url)
      if (!init) init = {}
    }
    const path = url.toString()
    if (path.includes('/import')) {
      return handleImport(init)
    }
    if (path.includes('/export')) {
      return Promise.resolve(handleExport(url))
    }
    return Promise.resolve(new Response('Not found', { status: 404 }))
  }
}

export function setupMockServer() {
  const mockData = createMockDataStore()
  const fetchImpl = createMockFetch(mockData)
  const mwServer = MoneyworksServer.create(
    'http://mockserver/MockDoc',
    fetchImpl,
  )
  return { mwServer, mockData }
}
