import type { SharedWorker } from "ava/plugin"
import getTestDatabase from "./helpers/get-test-database"

const getTestDatabaseWorker = async (protocol: SharedWorker.Protocol<any>) => {
  for await (const message of protocol.subscribe()) {
    const { externalDatabaseUrl, client, databaseName } =
      await getTestDatabase()

    message.reply({
      externalDatabaseUrl,
    })

    message.testWorker.teardown(async () => {
      await client.query(`DROP DATABASE ${databaseName};`)
      await client.end()
    })
  }
}

export default getTestDatabaseWorker
