import * as xml from '@libs/xml'
import { assert } from '@std/assert'
import {
  parseMoneyworksTime,
  parseXmlRecords,
  stringifyXmlRecords,
  toMoneyworksTime,
} from './moneyworks-parser.ts'
import { expect } from '@std/expect'

Deno.test('parseXmlRecords with example data', async () => {
  const exampleXml = await Deno.readTextFile(
    new URL('.', import.meta.url).pathname +
      './data/pull-example.xml',
  )

  const results = parseXmlRecords(exampleXml, 'code')

  expect(results.length).toEqual(5)

  expect(results[0]?.id).toEqual('000005')
  expect(results[0]?.lastModified).toEqual(1704455492000)
  expect(results[0]?.json).toBeDefined()

  expect(results[4]?.id).toEqual('000021')
  expect(results[4]?.lastModified).toEqual(1704455492000)
  expect(results[4]?.json).toBeDefined()
})

Deno.test('parseXmlRecords throws if lastModified is in the future', () => {
  const futureXml = `
    <table>
      <name>
        <lastmodifiedtime>99990101000000</lastmodifiedtime>
        <code>FUTURE_TEST</code>
      </name>
    </table>
  `
  expect(() => parseXmlRecords(futureXml, 'code')).not.toThrow()
})

Deno.test('toMoneyworksTime', () => {
  const string = '20240105115132'
  const time = parseMoneyworksTime(string)
  const mw = toMoneyworksTime(time)
  expect(mw).toEqual(string)
})

Deno.test('round trip XML serialization', () => {
  const records = [
    {
      id: 'TEST001',
      lastModified: 1704455492000,
      json: {
        code: 'TEST001',
        name: 'Test Record',
        lastmodifiedtime: '20240105115132',
      },
    },
  ]

  const xml = stringifyXmlRecords('test', records)
  const parsed = parseXmlRecords(xml, 'code')

  expect(parsed.length).toEqual(1)
  assert(parsed[0])
  expect(parsed[0].id).toEqual(records[0]?.id)
  expect(parsed[0].lastModified).toEqual(records[0]?.lastModified)
  expect(parsed[0].json).toEqual(records[0]?.json)
  validateXmlRoundTrip(parsed[0].json)
})

function validateXmlRoundTrip(json: unknown) {
  const withRoot = { test: json }
  const snippet = xml.stringify(withRoot)
  if ('~name' in withRoot) {
    // https://github.com/lowlighter/libs/issues/94
    delete (withRoot as Record<string, unknown>)['~name']
  }
  const recovered = xml.parse(snippet)
  expect(recovered).toEqual(withRoot)
}
