#!/usr/bin/env -S deno run --allow-read --allow-write
// deno-lint-ignore-file no-console
import fg from 'fast-glob'
import globToRegExp from 'glob-to-regexp'
import { dirname, relative, resolve } from 'node:path'
import { encode } from 'gpt-tokenizer/model/o1-preview'

import denoData from './deno.json' with { type: 'json' }

const defaultIgnores = [
  '*.lock',
  '.git',
  '.git/**',
  '.gitignore',
  'LICENSE',
  '**/concat.txt',
  '**/.env*',
  '**/node_modules/**',
  '**/*.pdf',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.svg',
  '**/*.css',
  '**/*.scss',
  '**/*.exe',
  '**/*.bin',
  '**/*.mp3',
  '**/*.mp4',
  '**/*.mov',
  '**/*.avi',
  '**/pnpm-lock.yaml',
  '**/*.lock',
  '**/.DS_Store',
  '**/.thumbs.db',
  '**/package-lock.json',
]

const printHelp = (): void => {
  console.log(`concat v${denoData.version}

Usage:
  concat [options] [glob ...]
  
Options:
  --help
  --output FILE
  --stdout
  --ignore or -i [patterns...] (all subsequent values are ignore globs)

If no arguments are provided, it's equivalent to "." -> which is effectively "**/*".
`)
}

const compareSemver = (a: string, b: string): number => {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff < 0 ? -1 : 1
  }
  return 0
}

const isProbablyBinary = (buffer: Uint8Array): boolean => {
  for (const byte of buffer) {
    if (byte === 0x00) return true
  }
  return false
}

export const main = async (args = [...Deno.args]): Promise<void> => {
  if (args.includes('--help')) {
    printHelp()
    Deno.exit(0)
  }

  let outputFile: string | undefined
  let toStdout = false
  const ignoreGlobs: string[] = []

  let i = 0
  while (i < args.length) {
    const a = args[i]
    if (a === '--output') {
      if (i + 1 >= args.length) {
        console.error('Error: --output specified but no file provided')
        Deno.exit(1)
      }
      outputFile = args[i + 1]
      args.splice(i, 2)
    } else if (a === '--stdout') {
      toStdout = true
      args.splice(i, 1)
    } else if (a === '--ignore' || a === '-i') {
      args.splice(i, 1)
      while (i < args.length && !args[i]?.startsWith('-')) {
        ignoreGlobs.push(args[i] as string)
        args.splice(i, 1)
      }
    } else {
      i++
    }
  }

  if (args.length === 0) {
    args = ['.']
  }
  if (args.length === 1 && args[0] === '.') {
    args = ['**/*']
  }
  if (!outputFile && !toStdout) {
    outputFile = 'concat.txt'
  }

  const allIgnoredRegex = [...defaultIgnores, ...ignoreGlobs].map((g) =>
    globToRegExp(g, { globstar: true })
  )

  let fileExistedBefore = false
  if (outputFile && !toStdout) {
    try {
      await Deno.stat(outputFile)
      fileExistedBefore = true
    } catch {
      fileExistedBefore = false
    }
  }

  type WriterLike = {
    write(p: Uint8Array): Promise<number> | number
    close?: () => void
  }
  let out: WriterLike
  if (toStdout) {
    out = Deno.stdout
  } else {
    await Deno.mkdir(dirname(outputFile as string), { recursive: true })
    out = await Deno.open(outputFile as string, {
      write: true,
      create: true,
      truncate: true,
    })
  }

  const enc = new TextEncoder()
  const processed = new Set<string>()
  const fileInfos: { path: string; bytes: number; tokens: number }[] = []

  const outAbs = outputFile ? resolve(Deno.cwd(), outputFile) : null

  for (const pattern of args) {
    const paths = await fg(pattern, {
      dot: true,
      onlyFiles: true,
      unique: true,
      globstar: true,
    })

    for (const p of paths) {
      const absPath = resolve(p)
      const rel = relative(Deno.cwd(), absPath)
      if (processed.has(rel)) continue
      if (outAbs && absPath === outAbs) continue
      const ignored = allIgnoredRegex.some((re) => re.test(rel))
      if (ignored) continue

      const bytes = await Deno.readFile(absPath)
      if (isProbablyBinary(bytes)) continue

      processed.add(rel)
      const data = new TextDecoder().decode(bytes)
      const chunk =
        `-----BEGIN FILE ${rel}-----\n${data}\n-----END FILE ${rel}-----\n`
      const fileTokens = await encode(chunk)
      fileInfos.push({
        path: rel,
        bytes: bytes.length,
        tokens: fileTokens.length,
      })
      await out.write(enc.encode(chunk))
    }
  }

  if (out.close) out.close()

  if (!toStdout && outputFile) {
    if (fileInfos.length > 0) {
      console.log('Processed files:')
      for (const info of fileInfos) {
        console.log(
          `- ${info.path} (${info.bytes} bytes, ${info.tokens} tokens)`,
        )
      }
      console.log(`Total files processed: ${fileInfos.length}`)
    } else {
      console.log('No files processed.')
    }

    const outputText = await Deno.readTextFile(outputFile)
    const tokens = await encode(outputText)
    const formattedTokenCount = humanize(tokens.length)
    const fileStatus = fileExistedBefore ? 'updated' : 'created'
    console.log(
      `✅ Operation complete! ${fileStatus} ${outputFile} with ${formattedTokenCount} o1 tokens. 🎉`,
    )

    const currentVersion = `v${denoData.version}`
    try {
      const metaRes = await fetch(
        'https://jsr.io/@dreamcatcher/concat/meta.json',
        {
          headers: { Accept: 'application/json' },
        },
      )
      if (metaRes.ok) {
        const meta = await metaRes.json()
        const availableVersions = Object.keys(meta.versions).filter((v) =>
          !meta.versions[v].yanked
        )
        const latest = availableVersions.sort((a, b) => compareSemver(a, b))[
          availableVersions.length - 1
        ]
        if (latest && compareSemver(latest, currentVersion) > 0) {
          console.log(`
A newer version (${latest}) is available. Run:
deno install --global --reload --force --allow-read --allow-write --allow-net=jsr.io jsr:@dreamcatcher/concat@${latest}
`)
        }
      }
    } catch {
      // ignore fetch errors
    }
  }
}

if (import.meta.main) {
  main()
}

function humanize(
  n: number,
  options: { delimiter?: string; separator?: string } = {},
) {
  options = options || {}
  const d = options.delimiter || ','
  const s = options.separator || '.'
  const nStr = n.toString().split('.')
  if (!nStr[0]) return ''
  nStr[0] = nStr[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + d)
  return nStr.join(s)
}
