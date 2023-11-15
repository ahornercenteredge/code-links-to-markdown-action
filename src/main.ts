import * as core from '@actions/core'
import { listFiles } from './listFiles'
import { mergeCode } from './mergeCode'
import { readFile } from 'fs/promises'
import path from 'path'
import fs from 'fs'
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const root: string = core.getInput('rootPath')
    const startdir = __dirname
    process.chdir(root)

    // get all the markdown files, starting from the rootPath
    core.debug(`rootPath: ${root}`)
    const files = await listFiles(root)
    for (const file of files) {
      const contents1 = await readFile(path.join(root, file), {
        encoding: 'utf8'
      })

      core.debug(contents1.toString())
      core.debug(`checking file: ${path.join(root, file)}`)
      await mergeCode(path.join(root, file))

      core.debug(
        `file still exists: ${fs.existsSync(path.join(root, file)).toString()}`
      )
      const contents = await readFile(path.join(root, file), {
        encoding: 'utf8'
      })

      core.debug(contents.toString())
    }

    process.chdir(startdir)

    core.debug(files.join(', '))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
