// A small script to update Zapatos typings for tests
import test from "ava"
import * as zg from "zapatos/generate"
import { getTestDatabase } from "./plugins"

test("update Zapatos typings", async (t) => {
  const { externalDatabaseUrl } = await getTestDatabase()

  await zg.generate({
    db: { connectionString: externalDatabaseUrl },
    outDir: "./src/tests/types",
  })

  t.pass()
})
