import * as xml from '@libs/xml'
import type { MoneyworksRecord } from './types.ts'
import Debug from 'debug'
const debug = Debug('crm:moneyworks-parser')
/**
 * Parse an XML string (containing one or more <table> elements)
 * into an array of { id, lastModified, json } objects.
 * This is unchanged from your existing logic, except for minor
 * type clarifications. Adjust as needed.
 */
export const parseXmlRecords = (xmlString: string, primaryKey: string) => {
  const doc = xml.parse(xmlString)
  if (!doc.table) {
    throw new Error('No <table> elements in XML')
  }
  const tables = Array.isArray(doc.table) ? doc.table : [doc.table]
  const results: MoneyworksRecord[] = []

  for (const tableObj of tables) {
    for (const [tagName, value] of Object.entries(tableObj || {})) {
      if (
        tagName.startsWith('@') ||
        tagName.startsWith('#') ||
        tagName.startsWith('~')
      ) {
        continue
      }

      const items = Array.isArray(value) ? value : [value]
      for (const json of items) {
        if (!json) {
          throw new Error('Record missing JSON')
        }
        const id = extractText(json[primaryKey])
        if (!id) {
          debug(
            `Record missing primary key <${primaryKey}> + ${
              JSON.stringify(json, null, 2)
            }`,
          )
          continue
        }
        const lastModifiedString = extractText(json.lastmodifiedtime)
        if (!lastModifiedString) {
          throw new Error(
            'Record missing <lastmodifiedtime>: ' +
              JSON.stringify(json, null, 2),
          )
        }

        const lastModified = parseMoneyworksTime(lastModifiedString)
        if (lastModified > Date.now() + 60_000) {
          const delta = lastModified - Date.now()
          debug(`Timetravel detected: ${lastModifiedString} (${delta}ms`)
        }

        results.push({
          id,
          lastModified,
          json,
        })
      }
    }
  }
  return results
}

export function stringifyXmlRecords(
  tableName: string,
  records: MoneyworksRecord[],
): string {
  const doc = {
    '@version': '1.0',
    table: {
      '@name': tableName,
      '@update': 'true',
      [tableName.toLowerCase()]: records.map(toTerseJson),
    },
  }
  return xml.stringify(doc)
}

function toTerseJson(record: MoneyworksRecord) {
  const terse = { ...record.json }
  for (const [key, value] of Object.entries(terse)) {
    if (typeof value === 'object' && value && '@system' in value) {
      delete terse[key]
    }
  }
  return terse
}

/**
 * Parse a YYYYMMDDHHmmss string into UTC using the local timezone. Throws if
 * invalid length.
 */
export function parseMoneyworksTime(value: string): number {
  if (value.length !== 14) {
    throw new Error(`Invalid <lastmodifiedtime> format: ${value}`)
  }
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  const hour = Number(value.slice(8, 10))
  const minute = Number(value.slice(10, 12))
  const second = Number(value.slice(12, 14))

  const date = new Date(year, month - 1, day, hour, minute, second)
  return date.getTime()
}

function extractText(node: unknown) {
  if (!node) return ''
  if (typeof node === 'object' && node !== null) {
    return (node as Record<string, unknown>)['#text']?.toString() ?? ''
  }
  return String(node)
}

export function toMoneyworksTime(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')

  return `${year}${month}${day}${hour}${minute}${second}`
}
