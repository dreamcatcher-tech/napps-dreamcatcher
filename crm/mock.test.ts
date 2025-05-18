import { expect } from '@std/expect'
import { setupMockServer } from './mock.ts'

Deno.test('mock moneyworks server e2e', async () => {
  const { mwServer, mockData } = setupMockServer()
  mockData.set('Name', [
    {
      id: 'TEST001',
      lastModified: Date.UTC(2024, 0, 1, 12, 0, 0),
      json: {
        code: { '#text': 'TEST001' },
        lastmodifiedtime: { '#text': '20240101120000' },
        name: { '#text': 'ABC Company' },
      },
    },
  ])
  const ok = await mwServer.check()
  expect(ok).toEqual(true)
  const xmlData = await mwServer.exportTable('Name')
  expect(xmlData).toContain('ABC Company')
  await mwServer.importTable(`
    <?xml version="1.0"?>
    <table name="Name">
      <Name>
        <code>TEST002</code>
        <lastmodifiedtime>20240101120100</lastmodifiedtime>
        <name>NewCorp</name>
      </Name>
    </table>
  `)
  const names = mockData.get('Name') ?? []
  const found = names.find((n) => n.id === 'TEST002')
  expect(found).toBeDefined()
  expect(found?.json).toHaveProperty('name', 'NewCorp')
})
