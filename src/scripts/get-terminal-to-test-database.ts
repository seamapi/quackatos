import path from "node:path"
import child_process from "node:child_process"
import ora from "ora"
import getTestDatabase from "~/tests/fixtures/workers/helpers/get-test-database"

const getTerminalToTestDatabase = async () => {
  const spinner = ora("Booting up database...").start()

  let fixture

  try {
    fixture = await getTestDatabase(path.join(__dirname, "../tests/assets"))
  } catch (error) {
    spinner.fail((error as Error).message)
    throw error
  }

  spinner.stop()

  child_process.spawn(
    "docker",
    [
      "exec",
      "-it",
      fixture.container.getId(),
      "psql",
      "-U",
      "postgres",
      "-d",
      fixture.databaseName,
    ],
    { stdio: "inherit" }
  )
}

void getTerminalToTestDatabase()
