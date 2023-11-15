import * as core from '@actions/core'
import events from 'events'
import fs from 'fs'
import path from 'path'
import readline from 'readline'
/**
 * Wait for a number of milliseconds.
 * @param milliseconds The number of milliseconds to wait.
 * @returns {Promise<string>} Resolves with 'done!' after the wait is over.
 */
export async function mergeCode(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (filePath === undefined || filePath === null || filePath === '') {
      throw new Error('file path is invalid')
    }

    const tempFile = `${filePath}.temp`
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    })
    const ws = fs.createWriteStream(tempFile, {
      encoding: 'utf8',
      autoClose: true
    })

    rl.on('line', async line => {
      line = line.toString()
      // Find any replaceable code blocks
      const regex = /```CODE\((.*)\)```/
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
          replacement.forEach(l => {
            ws.write(l)
          })
          return
        }
        core.debug(`final line: ${line}`)
      }

      ws.write(line)
    })

    rl.on('end', () => {
      ws.end()
    })

    ws.on('finish', async () => {
      try {
        core.debug(`Finished merge. Replacing ${filePath} with ${tempFile}`)
        // Delete the original file
        fs.unlink(filePath, err => {
          if (err) throw err
        })
        // Rename the new file to replace the original
        await _renameFile(tempFile, filePath)
        resolve()
      } catch (err) {
        reject(new Error(`Error renaming ${filePath} to ${tempFile}: ${err}`))
      }
    })

    rl.on('error', error =>
      reject(new Error(`Error: Error reading ${filePath} => ${error.message}`))
    )
    ws.on('error', error =>
      reject(
        new Error(`Error: Error writing to ${tempFile} => ${error.message}`)
      )
    )
  })
}

async function _renameFile(
  oldPath: fs.PathLike,
  newPath: fs.PathLike
): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, error => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

async function _extractFileLines(
  file: fs.PathLike,
  range: string[] | null
): Promise<string[] | undefined> {
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream(file),
      crlfDelay: Infinity
    })

    let result: string[] = []
    let i = 1
    rl.on('line', line => {
      line = line.toString()
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
    })

    await events.once(rl, 'close')
    return result
  } catch (err) {
    core.debug(`ERROR: ${err}`)
    return undefined
  }
}
