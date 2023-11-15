import fs from 'fs'
import path from 'path'
/**
 * Wait for a number of milliseconds.
 * @param milliseconds The number of milliseconds to wait.
 * @returns {Promise<string>} Resolves with 'done!' after the wait is over.
 */
export async function listFiles(root: string): Promise<string[]> {
  return new Promise(resolve => {
    if (root === undefined || root === null || root === '') {
      throw new Error('root directory is invalid')
    }

    const filelist = fs.readdirSync(root, { recursive: true }).filter(f => {
      const file = f as string
      return path.extname(file).toLowerCase() === '.md'
    })
    resolve(filelist as string[])
  })
}
