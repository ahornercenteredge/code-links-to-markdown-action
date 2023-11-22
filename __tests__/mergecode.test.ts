/**
 * Unit tests for src/wait.ts
 */

import path from 'path'
import fs from 'fs'
import { Writable } from 'stream'
import { mergeCode } from '../src/mergeCode'
import { expect } from '@jest/globals'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  createWriteStream: jest.fn().mockImplementation(() => {
    const mockStream = Object.assign(new Writable(), {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    })
    return mockStream
  }),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}))

jest.mock('path', () => ({
  resolve: jest.fn()
}))

jest.mock('@actions/core')

describe('mergeCode.ts', () => {
  it('should throw an error if file does not exist', async () => {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const filePath: any = undefined
    jest.spyOn(path, 'resolve').mockReturnValue(filePath)
    jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    await expect(mergeCode(filePath)).rejects.toThrow('file path is invalid')
  })
})
