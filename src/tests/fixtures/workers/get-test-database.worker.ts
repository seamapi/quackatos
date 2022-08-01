import { GenericContainer, StartedTestContainer } from "testcontainers"
import type { SharedWorker } from "ava/plugin"
import { Pool } from "pg"
import path from "node:path"
import getRandomDatabaseName from "./helpers/get-random-database-name"
import createTemplate from "./helpers/create-template"

let container: StartedTestContainer
let templateName: string

const getTestDatabase = async (protocol: SharedWorker.Protocol<any>) => {
  for await (const message of protocol.subscribe()) {
    if (!container) {
      container = await new GenericContainer("postgres:13")
        .withExposedPorts(5432)
        .withEnv("POSTGRES_HOST_AUTH_METHOD", "trust")
        .withEnv("PGDATA", "/var/lib/postgresql/data")
        .withCmd([
          "-c",
          "max_connections=1000",
          "-c",
          "fsync=off",
          "-c",
          "synchronous_commit=off",
          "-c",
          "full_page_writes=off",
        ])
        .withTmpFs({ "/var/lib/postgresql/data": "rw" })
        .withBindMount(path.join(__dirname, "../../assets/pagila"), "/pagila")
        .withStartupTimeout(120_000)
        .start()
    }

    const postgresClient = new Pool({
      connectionString: `postgresql://postgres:@${container.getHost()}:${container.getMappedPort(
        5432
      )}/postgres`,
    })

    const databaseName = getRandomDatabaseName()
    const externalDatabaseUrl = `postgresql://postgres:@${container.getHost()}:${container.getMappedPort(
      5432
    )}/${databaseName}`

    // We base new test databases off of templates so we only pay the setup cost once.
    if (!templateName) {
      templateName = await createTemplate(container)
    }

    await postgresClient.query(
      `CREATE DATABASE ${databaseName} TEMPLATE ${templateName};`
    )

    await postgresClient.end()

    message.reply({
      externalDatabaseUrl,
    })
  }
}

export default getTestDatabase
