import test from "ava"
import { assert, Equals } from "tsafe"
import { getTestDatabase } from "~/tests"
import { InsertCommand } from "./insert"

test("insert works", async (t) => {
  const { pool } = await getTestDatabase()

  const {
    rows: [{ count: countBeforeInsert }],
  } = await pool.query(`SELECT COUNT(*) FROM actor`)

  const result = await new InsertCommand("actor")
    .values(
      {
        first_name: "foo",
        last_name: "bar",
      },
      {
        first_name: "baz",
        last_name: "qux",
      }
    )
    .run(pool)

  assert<Equals<typeof result, never>>()

  const {
    rows: [{ count: countAfterInsert }],
  } = await pool.query(`SELECT COUNT(*) FROM actor`)
  t.is(parseInt(countAfterInsert, 10), parseInt(countBeforeInsert, 10) + 2)
})
