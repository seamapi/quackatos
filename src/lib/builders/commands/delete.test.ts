import test from "ava"
import { assert, Equals } from "tsafe"
import { getTestDatabase } from "~/tests"
import { DeleteCommand } from "./delete"

test("delete works", async (t) => {
  const { pool } = await getTestDatabase()

  const {
    rows: [{ count: countBeforeDelete }],
  } = await pool.query(
    `SELECT COUNT(*) FROM film_actor WHERE film_id IN (1, 2, 3)`
  )
  t.not(parseInt(countBeforeDelete, 10), 0)

  const result = await new DeleteCommand("film_actor")
    .whereIn("film_id", [1, 2, 3])
    .run(pool)

  assert<Equals<typeof result, never>>()

  const {
    rows: [{ count: countAfterDelete }],
  } = await pool.query(
    `SELECT COUNT(*) FROM film_actor WHERE film_id IN (1, 2, 3)`
  )
  t.is(parseInt(countAfterDelete, 10), 0)
})
