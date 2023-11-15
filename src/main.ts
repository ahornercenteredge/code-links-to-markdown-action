import * as core from '@actions/core'
import { listFiles } from './listFiles'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const root: string = core.getInput('rootPath')

    // get all the markdown files, starting from the rootPath
    core.debug(`rootPath: ${root}`)
    const files = await listFiles(root)

    core.debug(files.join(', '))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
