import test from "ava"
import { assert, Equals } from "tsafe"
import { createMacroForBuilder, getTestDatabase } from "~/tests"
import * as schema from "zapatos/schema"
import * as db from "zapatos/db"
import { UpdateCommand } from "./update"

const macro = createMacroForBuilder({
  builderFactory: () => new UpdateCommand("film"),
})

test("throws if no where conditions", async (t) => {
  const { pool } = await getTestDatabase()

  await t.throwsAsync(async () => {
    await new UpdateCommand("film").set("title", "foo").run(pool)
  })
})

test(
  "set() (object)",
  macro,
  (builder) => builder.set({ title: "foo" }).where(db.all),
  async (t, _result, _query, pool) => {
    const result = await pool.query(
      "SELECT title FROM film WHERE title = 'foo' LIMIT 1"
    )
    t.is(result.rows.length, 1)
  }
)

test(
  "set() (single column)",
  macro,
  (builder) => builder.set("title", "foo").where(db.all),
  async (t, _result, _query, pool) => {
    const result = await pool.query(
      "SELECT title FROM film WHERE title = 'foo' LIMIT 1"
    )
    t.is(result.rows.length, 1)
  }
)

test("set() (merges)", macro, (builder) =>
  builder
    .whereIn("film_id", [1])
    .set("title", "foo")
    .set({ description: "bar" })
    .returning("title", "description")
)

test("returning() (array)", macro, (builder) =>
  builder.set({ title: "foo" }).whereIn("film_id", [1]).returning(["title"])
)

test("returning() (rest parameter)", macro, (builder) =>
  builder
    .set({ title: "foo" })
    .whereIn("film_id", [1])
    .returning("title", "film_id")
)

test("returning()", macro, (builder) =>
  builder.set({ title: "foo" }).whereIn("film_id", [1]).returning("film_id")
)

test("returning() (*, typed correctly)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new UpdateCommand("film")
    .set({ title: "foo" })
    .where(db.all)
    .returning("*")
    .run(pool)

  assert<Equals<typeof result[0], schema.film.Selectable>>()
  t.pass()
})

test("returning() (two columns, typed correctly)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new UpdateCommand("film")
    .set({ title: "foo" })
    .where(db.all)
    .returning(["film_id", "title"])
    .run(pool)

  assert<
    Equals<typeof result[0], Pick<schema.film.Selectable, "film_id" | "title">>
  >()
  t.pass()
})

test("returning() (merges, typed correctly)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new UpdateCommand("film")
    .set({ title: "foo" })
    .where(db.all)
    .returning("film_id")
    .returning("title")
    .run(pool)

  assert<
    Equals<typeof result[0], Pick<schema.film.Selectable, "film_id" | "title">>
  >()
  t.pass()
})