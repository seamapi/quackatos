import path from "node:path"
import { Pool } from "pg"
import { registerSharedTypeScriptWorker } from "ava-typescript-worker"

export type WorkerPublishedMessage = {
  externalDatabaseUrl: string
}

const databaseWorker = registerSharedTypeScriptWorker({
  filename: path.join(
    __dirname,
    "../",
    "workers",
    "get-test-database.worker.ts"
  ),
})

export const getTestDatabase = async () => {
  const message = databaseWorker.publish({})
  const reply = await message.replies().next()
  const { externalDatabaseUrl }: WorkerPublishedMessage = reply.value.data

  const pool = new Pool({
    connectionString: externalDatabaseUrl,
  })

  return {
    pool,
    externalDatabaseUrl,
  }
}
