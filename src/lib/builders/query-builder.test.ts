import test from "ava"
import { getTestDatabase } from "~/tests/fixtures/plugins"
import { QueryBuilder } from "./query-builder"

test("select()", async (t) => {
  const { pool } = await getTestDatabase()
  const query = new QueryBuilder().select("film").columns("film_id").limit(1)
  const result = await query.run(pool)

  t.snapshot(result)
})
