import * as core from '@actions/core'
import fs from 'fs'
import path from 'path'
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
    const rs = fs.createReadStream(filePath, {
      encoding: 'utf8',
      autoClose: true
    })
    const ws = fs.createWriteStream(tempFile, {
      encoding: 'utf8',
      autoClose: true
    })

    rs.on('data', async chunk => {
      chunk = chunk.toString()
      // Find any replaceable code blocks
      const regex = /```CODE\((.*\))```/g
      const match = chunk.match(regex)
      if (match != null) {
        core.debug(`found match in file ${filePath}: ${match.join(' : ')}`)
        // Get the replacement text
        const args = match[1].split('|')
        const file = path.resolve(args[0])
        core.debug(args[0])
        core.debug(file)
        if (!fs.existsSync(file)) {
          throw new Error('code path is invalid')
        }
        let lines: string[] = []
        if (args[1]) {
          if (args[1].includes('-')) {
            lines.push(args[1])
          } else {
            lines = args[1].split('-')
          }
        }
        const replacement = await _extractFileLines(file, lines)
        chunk.replace(match[0], replacement)
      }

      ws.write(chunk)
    })

    rs.on('end', () => {
      ws.end()
    })

    ws.on('finish', async () => {
      try {
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

    rs.on('error', error =>
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
  range: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(file, { encoding: 'utf8', autoClose: true })
    let result = ''
    let line = 0
    rs.on('data', chunk => {
      if (range.length === 1 && line === parseInt(range[0])) {
        result += chunk.toString()
      } else if (
        range.length === 2 &&
        line >= parseInt(range[0]) &&
        line <= parseInt(range[1])
      ) {
        result += chunk.toString()
      }
      line++
    })

    rs.on('end', () => {
      resolve(result)
    })

    rs.on('error', err => {
      reject(err)
    })
  })
}
