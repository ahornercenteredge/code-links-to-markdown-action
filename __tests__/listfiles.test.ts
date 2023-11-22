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
})
