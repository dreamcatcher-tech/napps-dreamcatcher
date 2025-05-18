// deno-lint-ignore-file no-console
import { main } from './main.ts'
import { expect } from '@std/expect'
import { encode } from 'gpt-tokenizer/model/o1-preview'

Deno.test('should ignore concat.txt and known binary extensions', async () => {
  const cwd = Deno.cwd()
  const tmp = await Deno.makeTempDir()
  try {
    Deno.chdir(tmp)
    await Deno.writeTextFile('testA.txt', 'Hello')
    await Deno.writeTextFile('concat.txt', 'Should be ignored')
    await Deno.writeFile('testB.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47])) // PNG signature

    await main([
      'testA.txt',
      'testB.png',
      'concat.txt',
      '--output',
      'testOut.txt',
    ])

    const result = await Deno.readTextFile('testOut.txt')
    const tokens = await encode(result)

    expect(result.includes('testA.txt')).toBe(true) // included
    expect(result.includes('concat.txt')).toBe(false) // ignored
    expect(result.includes('testB.png')).toBe(false) // ignored/binary
    expect(tokens.length).toBeGreaterThan(0)

    await Deno.remove('testA.txt')
    await Deno.remove('testB.png')
    await Deno.remove('concat.txt')
    await Deno.remove('testOut.txt')
  } finally {
    Deno.chdir(cwd)
    await Deno.remove(tmp, { recursive: true })
  }
})

Deno.test('should respect multiple ignores after -i', async () => {
  const cwd = Deno.cwd()
  const tempDir = await Deno.makeTempDir()
  try {
    Deno.chdir(tempDir)
    await Deno.writeTextFile('testC.md', 'Sample content')
    await Deno.writeTextFile('testD.css', 'body { color: red }')
    await Deno.writeTextFile('testE.scss', '$bg-color: blue;')

    // run with pattern "."
    await main(['.', '--output', 'testOut2.txt', '-i', '*.css', '*.scss'])

    const result = await Deno.readTextFile('testOut2.txt')
    expect(result.includes('testC.md')).toBe(true)
    expect(result.includes('testD.css')).toBe(false)
    expect(result.includes('testE.scss')).toBe(false)
  } finally {
    Deno.chdir(cwd)
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test('should output token count per file', async () => {
  const cwd = Deno.cwd()
  const tmp = await Deno.makeTempDir()
  try {
    Deno.chdir(tmp)
    await Deno.writeTextFile('testF.txt', 'some text here')
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.join(' '))
    }

    await main(['testF.txt', '--output', 'testOut3.txt'])

    console.log = origLog
    const summaryLine = logs.find((line) => line.includes('testF.txt ('))
    expect(summaryLine).not.toBeUndefined()

    await Deno.remove('testF.txt')
    await Deno.remove('testOut3.txt')
  } finally {
    Deno.chdir(cwd)
    await Deno.remove(tmp, { recursive: true })
  }
})
