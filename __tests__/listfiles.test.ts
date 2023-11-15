/**
 * Unit tests for src/wait.ts
 */

import { listFiles } from '../src/listFiles'
import { expect } from '@jest/globals'

describe('listFiles.ts', () => {
  it('throws an invalid path', async () => {
    const input = ''
    expect(input === '').toBe(true)

    await expect(listFiles(input)).rejects.toThrow('root directory is invalid')
  })

  it('lists files with a valid path', async () => {
    const input = 'example'
    const files = await listFiles(input)

    expect(files.length).toBeGreaterThan(0)
  })
})
