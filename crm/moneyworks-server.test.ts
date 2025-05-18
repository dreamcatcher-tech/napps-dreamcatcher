import { expect } from '@std/expect'
import { MoneyworksServer } from './moneyworks-server.ts'

function mockResponse(body: string, ok = true, status = 200): Response {
  return new Response(body, { status, statusText: ok ? 'OK' : 'Error' })
}

Deno.test('MoneyworksServer.check() - success', async () => {
  const fetchMock: typeof fetch = (_input, _init) =>
    Promise.resolve(mockResponse('9.0', true))

  const server = MoneyworksServer.create(
    'http://user:pass@fake-moneyworks',
    fetchMock,
  )
  const check = await server.check()
  expect(check).toBe(true)
})

Deno.test('MoneyworksServer.check() - error thrown if not ok', async () => {
  const fetchMock: typeof fetch = (_input, _init) =>
    Promise.resolve(mockResponse('Something went wrong', false, 500))

  const server = MoneyworksServer.create(
    'http://user:pass@fake-moneyworks',
    fetchMock,
  )
  const check = await server.check()
  expect(check).toBe(false)
})

Deno.test('MoneyworksServer.exportTable() - success, no lastModifiedTime', async () => {
  const xmlMock = `
    <?xml version="1.0"?>
    <table name="Name" count="2" start="0" found="100">
      <name><code>TEST1</code></name>
      <name><code>TEST2</code></name>
    </table>
  `
  const fetchMock: typeof fetch = (_input, _init) =>
    Promise.resolve(mockResponse(xmlMock))

  const server = MoneyworksServer.create(
    'http://user:pass@fake-moneyworks/MyDoc',
    fetchMock,
  )
  const result = await server.exportTable('name')
  expect(result).toEqual(xmlMock)
})

Deno.test('MoneyworksServer.exportTable() - success, with lastModifiedTime (ms since epoch)', async () => {
  const xmlMock = `<?xml version="1.0"?><table name="Name"></table>`
  const fetchMock: typeof fetch = (input, _init) => {
    const urlStr = typeof input === 'string' ? input : input.toString()
    expect(urlStr).toMatch(/search=lastmodifiedtime%3E%3D\d{14}/)
    return Promise.resolve(mockResponse(xmlMock))
  }

  const server = MoneyworksServer.create(
    'http://user:pass@fake-moneyworks/MyDoc',
    fetchMock,
  )
  // 1234567890000 ms = Fri, 13 Feb 2009 23:31:30 UTC, for example
  const result = await server.exportTable('name', 1234567890000)
  expect(result).toEqual(xmlMock)
})

Deno.test('MoneyworksServer.exportTable() - error if server returns !ok', async () => {
  const fetchMock: typeof fetch = (_input, _init) =>
    Promise.resolve(mockResponse('Export error', false, 500))

  const server = MoneyworksServer.create(
    'http://user:pass@fake-moneyworks/MyDoc',
    fetchMock,
  )
  await expect(server.exportTable('name')).rejects.toThrow(
    'Failed to export data from name',
  )
})

Deno.test('MoneyworksServer.importTable() - success', async () => {
  const responseText = 'imported ok'
  const fetchMock: typeof fetch = (_input, init) => {
    expect(init?.method).toEqual('POST')
    if (!init?.headers) {
      throw new Error('No headers')
    }
    const headers = init.headers as Headers

    expect(headers.get('content-type')).toEqual('application/xml')
    expect(typeof init.body).toEqual('string')
    return Promise.resolve(mockResponse(responseText))
  }

  const server = MoneyworksServer.create(
    'http://user:pass@fake-moneyworks/AcmeDoc',
    fetchMock,
  )
  const result = await server.importTable('<someXML/>')
  expect(result).toEqual('imported ok')
})

Deno.test('MoneyworksServer.importTable() - error if response !ok', async () => {
  const fetchMock: typeof fetch = (_input, _init) =>
    Promise.resolve(mockResponse('Some import error', false, 500))

  const server = MoneyworksServer.create(
    'http://user:pass@fake-moneyworks/AcmeDoc',
    fetchMock,
  )
  await expect(server.importTable('<someXML/>')).rejects.toThrow(
    'Import failed: Some import error',
  )
})
