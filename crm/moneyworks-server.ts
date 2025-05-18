import { toMoneyworksTime } from './moneyworks-parser.ts'
import Debug from 'debug'
const debug = Debug('crm:moneyworks-server')

export class MoneyworksServer {
  private readonly fetchImpl: typeof fetch
  private readonly secureDocumentUrl: URL
  private readonly authHeader: string

  private constructor(secureDocumentString: string, fetchImpl?: typeof fetch) {
    const url = new URL(secureDocumentString)
    const user = url.username
    const pass = url.password
    url.username = ''
    url.password = ''
    url.pathname = url.pathname.replace(/\/+$/, '')
    this.secureDocumentUrl = url
    this.authHeader = 'Basic ' + btoa(`${user}:${pass}`)
    this.fetchImpl = fetchImpl ?? fetch
  }

  static create(secureDocumentString: string, fetchImpl?: typeof fetch) {
    return new MoneyworksServer(secureDocumentString, fetchImpl)
  }

  private async fetchWithAuth(
    path: string,
    init?: RequestInit,
  ): Promise<Response> {
    const pathname = this.secureDocumentUrl.pathname + '/' + path
    const url = new URL(pathname, this.secureDocumentUrl)
    debug('fetching %s', url.toString())

    init = init ?? {}
    const headers = new Headers(init.headers)
    headers.set('Authorization', this.authHeader)
    init.headers = headers

    return await this.fetchImpl(url, init)
  }
  async check(): Promise<boolean> {
    try {
      await this.exportTable('Name', Date.now())
      debug('check passed')
      return true
    } catch (err) {
      debug('check failed: %s', err)
      return false
    }
  }

  async exportTable(
    tableName: string,
    lastModifiedTime?: number,
  ): Promise<string> {
    const base = 'export'
    const params = new URLSearchParams({
      table: tableName,
      format: 'xml-verbose',
      no_linger: 'true',
    })
    if (lastModifiedTime) {
      if (lastModifiedTime > Date.now()) {
        const delta = lastModifiedTime - Date.now()
        debug('lastModifiedTime in the future: %s', delta)
        lastModifiedTime = Date.now()
      }
      const mwTime = toMoneyworksTime(lastModifiedTime)
      const mwTimeWithSpace = mwTime.slice(0, -6) + ' ' + mwTime.slice(-6)
      debug('lastModifiedTime: %s', mwTimeWithSpace)
      const searchExpr = `lastmodifiedtime>=${mwTime}`
      params.append('search', searchExpr)
    }
    debug('exportTable params: %s', params.toString())
    const resp = await this.fetchWithAuth(`${base}?${params.toString()}`)
    if (!resp.ok) {
      throw new Error(`Failed to export data from ${tableName}`)
    }
    debug('exportTable response: %s', resp.status)
    return resp.text()
  }

  async importTable(xmlPayload: string): Promise<string> {
    const path = 'import?no_linger=true'
    debug('importTable path: %s', path)
    const resp = await this.fetchWithAuth(path, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/xml',
      }),
      body: xmlPayload,
    })
    debug('importTable response: %s', resp.status)
    const result = await resp.text()
    if (!resp.ok) {
      throw new Error(`Import failed: ${result}`)
    }
    return result
  }
}
