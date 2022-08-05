import test from "ava"
import { assert, Equals } from "tsafe"
import { Simplify } from "type-fest"
import { sql } from "zapatos/db"
import * as schema from "zapatos/schema"
import { NullPartial } from "~/lib/util-types"
import { createMacroForBuilder, getTestDatabase } from "~/tests"
import { SelectCommand } from "./select"

const macro = createMacroForBuilder({
  builderFactory: () => new SelectCommand("film"),
})

test("select() (rest parameter)", macro, (builder) =>
  builder.select("title", "description").limit(1)
)

test("select() (typed correctly)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new SelectCommand("film")
    .limit(1)
    .select("title", "description")
    .run(pool)

  assert<
    Equals<
      typeof result[0],
      Pick<schema.film.Selectable, "title" | "description">
    >
  >()
  t.pass()
})

test("select() (merges)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new SelectCommand("film")
    .limit(1)
    .select("title")
    .select("description")
    .run(pool)

  assert<
    Equals<
      typeof result[0],
      Pick<schema.film.Selectable, "title" | "description">
    >
  >()
  t.pass()
})

test("select() (array)", macro, (builder) =>
  builder.select(["title", "description"]).limit(1)
)

test("select() (all columns with wildcard)", macro, (builder) =>
  builder.limit(1).select("*")
)

test(
  "select() (all columns with wildcard and duplicate column)",
  macro,
  (builder) => builder.limit(1).select("*", "film_id")
)

test("select() (all columns with table wildcard)", macro, (builder) =>
  builder.limit(1).select("film.*")
)

test("select() (two wildcards)", macro, (builder) =>
  builder.limit(1).select("*", "film.*")
)

test("select() (wildcard is typed correctly)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new SelectCommand("film")
    .limit(1)
    .select("film.*", "*")
    .run(pool)

  assert<Equals<typeof result[0], schema.film.Selectable>>()
  t.pass()
})

test(
  "limit()",
  macro,
  (builder) => builder.limit(1),
  (t, result) => {
    t.is(result.length, 1)
  }
)

test(
  "takes all rows by default",
  macro,
  (builder) => builder,
  (t, result) => {
    t.is(result.length, 1000)
  }
)

test(
  "takes all columns by default",
  macro,
  (builder) => builder.limit(1),
  (t, result) => {
    const numOfColumns = Object.keys(result[0]).length
    t.is(numOfColumns, 14)
  }
)

test("leftJoin()", macro, (builder) =>
  builder
    .limit(1)
    .leftJoin("film_actor", "film.film_id", "film_actor.film_id")
    .leftJoin("actor", "film_actor.actor_id", "actor.actor_id")
)

test("leftJoin() (with arbitrary condition)", macro, (builder) =>
  builder
    .limit(1)
    .leftJoin("film_actor", sql`${"film_actor.actor_id"} > ${"film.film_id"}`)
    .leftJoin("actor", "film_actor.actor_id", "actor.actor_id")
    .select("actor.actor_id", "film.film_id")
)

test("leftJoin() (*, typed correctly)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new SelectCommand("film")
    .leftJoin("film_actor", "film.film_id", "film_actor.film_id")
    .leftJoin("actor", "film_actor.actor_id", "actor.actor_id")
    .select("actor.*", "film.*")
    .run(pool)

  assert<
    Equals<
      Simplify<typeof result[0]>,
      Simplify<schema.film.Selectable & NullPartial<schema.actor.Selectable>>
    >
  >()
  t.pass()
})

test("leftJoin() (actor.*, typed correctly)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new SelectCommand("film")
    .leftJoin("film_actor", "film.film_id", "film_actor.film_id")
    .leftJoin("actor", "film_actor.actor_id", "actor.actor_id")
    .select("actor.*")
    .run(pool)

  assert<Equals<typeof result[0], NullPartial<schema.actor.Selectable>>>()
  t.pass()
})

test("leftJoin() and select() (merges)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new SelectCommand("film")
    .limit(1)
    .leftJoin("film_actor", "film.film_id", "film_actor.film_id")
    .leftJoin("actor", "actor.actor_id", "film_actor.actor_id")
    .select("actor.actor_id")
    .select("actor.first_name")
    .run(pool)

  assert<
    Equals<
      typeof result[0],
      Pick<NullPartial<schema.actor.Selectable>, "actor_id" | "first_name">
    >
  >()
  t.pass()
})

test("count()", macro, (builder) => builder.count())

test("count() (typed correctly)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new SelectCommand("film").count().run(pool)

  assert<Equals<typeof result, number>>()
  t.pass()
})
