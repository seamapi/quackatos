import test from "ava"
import { getTestDatabase } from "."
import * as db from "zapatos/db"

test("getTestDatabase() works", async (t) => {
  const { pool } = await getTestDatabase()

  await t.notThrowsAsync(async () => {
    const count = await db.count("actor", db.all).run(pool)

    t.snapshot(count)
  })
})
