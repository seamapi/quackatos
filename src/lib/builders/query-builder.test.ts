import test from "ava"
import { getTestDatabase } from "~/tests"
import { QueryBuilder } from "./query-builder"

test("select()", async (t) => {
  const { pool } = await getTestDatabase()
  const query = new QueryBuilder("film").select("film_id").limit(1)
  const result = await query.run(pool)

  t.snapshot(result)
})

test("insert()", async (t) => {
  const { pool } = await getTestDatabase()
  const query = new QueryBuilder("film")
    .whereIn("film_id", [1, 2])
    .insert({
      title: "Test",
      language_id: 1,
      description: "foo bar",
      fulltext: "foo bar",
    })
    .returning("*")

  const result = await query.run(pool)

  t.snapshot(result)
})

test("update()", async (t) => {
  const { pool } = await getTestDatabase()
  const query = new QueryBuilder("film")
    .whereIn("film_id", [1, 2])
    .update()
    .set("description", "foo bar")
    .returning(["film_id", "description"])
  const result = await query.run(pool)

  t.snapshot(result)
})

test("delete()", async (t) => {
  const { pool } = await getTestDatabase()
  const {
    rows: [{ count: countBeforeDelete }],
  } = await pool.query(
    `SELECT COUNT(*) FROM film_actor WHERE film_id IN (1, 2, 3)`
  )
  t.not(parseInt(countBeforeDelete, 10), 0)

  await new QueryBuilder("film_actor")
    .whereIn("film_id", [1, 2, 3])
    .delete()
    .run(pool)

  const {
    rows: [{ count: countAfterDelete }],
  } = await pool.query(
    `SELECT COUNT(*) FROM film_actor WHERE film_id IN (1, 2, 3)`
  )
  t.is(parseInt(countAfterDelete, 10), 0)
})
