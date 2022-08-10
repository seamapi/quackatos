import path from "node:path"
import child_process from "node:child_process"
import getTestDatabase from "~/tests/fixtures/workers/helpers/get-test-database"

const getTerminalToTestDatabase = async () => {
  const { databaseName, container } = await getTestDatabase(
    path.join(__dirname, "../tests/assets")
  )

  child_process.spawn(
    "docker",
    [
      "exec",
      "-it",
      container.getId(),
      "psql",
      "-U",
      "postgres",
      "-d",
      databaseName,
    ],
    { stdio: "inherit" }
  )
}

void getTerminalToTestDatabase()
