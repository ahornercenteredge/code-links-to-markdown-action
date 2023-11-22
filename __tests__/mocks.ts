import { Writable } from 'stream'

class WriteMemory extends Writable {
  buffer: string

  constructor() {
    super()
    this.buffer = ''
  }

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  _write(chunk: string, _: any, next: () => void): void {
    this.buffer += chunk
    next()
  }

  reset(): void {
    this.buffer = ''
  }
}

export const MockWriteStream = new WriteMemory()

export const mockCreateWriteStream = jest.fn().mockImplementation(() => {
  MockWriteStream.reset()
  return MockWriteStream
})
