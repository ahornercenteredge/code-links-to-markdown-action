import * as core from '@actions/core'
import fs from 'fs'
import path from 'path'
import * as fsPromise from 'fs/promises'
/**
 * Wait for a number of milliseconds.
 * @param milliseconds The number of milliseconds to wait.
 * @returns {Promise<string>} Resolves with 'done!' after the wait is over.
 */
export async function mergeCode(filePath: string): Promise<void> {
  if (filePath === undefined || filePath === null || filePath === '') {
    throw new Error('file path is invalid')
  }

  const tempFile = `${filePath}.temp`
  const ws = fs.createWriteStream(tempFile, {
    encoding: 'utf8',
    autoClose: true
  })

  ws.on('error', error =>
    core.debug(`Error: Error writing to ${tempFile} => ${error.message}`)
  )

  const regex = /```CODE\((.*)\)```/
  const rl = await fsPromise.open(filePath)
  for await (const line of rl.readLines()) {
    const match = line.match(regex)
    if (match != null) {
      core.debug(`found match in file ${filePath}: ${match.join(' : ')}`)
      // Get the replacement text
      const args = match[1].split('|')
      const file = path.resolve(path.dirname(filePath), args[0])
      core.debug(args[0])
      core.debug(file)
      if (!fs.existsSync(file)) {
        throw new Error('code path is invalid')
      }

      let lines: string[] | null = []
      if (args[1]) {
        core.debug(args[1])
        if (args[1].includes('-')) {
          lines = args[1].split('-')
        } else {
          lines.push(args[1])
        }
      } else {
        lines = null
      }
      if (lines) {
        core.debug(lines.join(', '))
      }
      const replacement = await _extractFileLines(file, lines)
      if (replacement) {
        ws.write('```\r\n')
        for (const l of replacement) {
          ws.write(`${l}\r\n`)
        }
        ws.write('```\r\n')
        continue
      }
    }

    ws.write(`${line}\r\n`)
  }

  ws.end()
  try {
    core.debug(`Finished merge. Replacing ${filePath} with ${tempFile}`)
    // Rename the new file to replace the original
    _renameFile(tempFile, filePath)
  } catch (err) {
    throw new Error(`Error renaming ${filePath} to ${tempFile}: ${err}`)
  }
}

function _renameFile(oldPath: fs.PathLike, newPath: fs.PathLike): void {
  fs.rename(oldPath, newPath, error => {
    if (error) {
      throw error
    }
  })
}

async function _extractFileLines(
  file: fs.PathLike,
  range: string[] | null
): Promise<string[] | undefined> {
  try {
    let result: string[] = []
    let i = 1
    const rl = await fsPromise.open(file)
    for await (const line of rl.readLines()) {
      if (range != null && range.length === 1 && i === parseInt(range[0])) {
        core.debug(`extracting line ${i} from file: ${line}`)
        result.push(line)
      } else if (
        range != null &&
        range.length === 2 &&
        i >= parseInt(range[0]) &&
        i <= parseInt(range[1])
      ) {
        core.debug(`extracting line ${i} from file: ${line}`)
        result.push(line)
      } else if (range === null) {
        core.debug(`extracting line ${i} from file: ${line}`)
        result.push(line)
      }
      i++
    }
    result = result.filter(() => true)
    return result
  } catch (err) {
    core.debug(`ERROR: ${err}`)
    return undefined
  }
}
