import * as core from '@actions/core'
import { listFiles } from './listFiles'
import { mergeCode } from './mergeCode'
import path from 'path'
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
      core.debug(`checking file: ${path.join(root, file)}`)
      await mergeCode(path.join(root, file))
    }

    process.chdir(startdir)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
