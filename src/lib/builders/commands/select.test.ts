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

test("orderBy()", macro, (builder) =>
  builder.orderBy("title", "DESC").select("title").limit(2)
)

test("orderBy() (defaults to ASC)", macro, (builder) =>
  builder.orderBy("title").select("title").limit(2)
)

test("orderBy() (with full spec)", macro, (builder) =>
  builder.orderBy({ by: "title", direction: "ASC" }).select("title").limit(2)
)

test("orderBy() (with array)", macro, (builder) =>
  builder
    .orderBy([{ by: "rating", direction: "DESC" }, { by: "title" }])
    .select("title", "rating")
    .limit(2)
)

test("orderBy() (works with join)", macro, (builder) =>
  builder
    .leftJoin("film_actor", "film.film_id", "film_actor.film_id")
    .orderBy("actor_id", "ASC")
    .select("film.film_id", "actor_id")
    .limit(2)
)

test("orderBy() (works with null options)", macro, (builder) =>
  builder
    .leftJoin("film_actor", "film.film_id", "film_actor.film_id")
    .orderBy({ by: "actor_id", direction: "DESC", nulls: "LAST" })
    .select("film.film_id", "actor_id")
    .limit(2)
)

test("result is casted correctly", async (t) => {
  const { pool } = await getTestDatabase()

  // Add jsonb column
  await pool.query('ALTER TABLE "staff" ADD COLUMN "data" jsonb')
  await pool.query('UPDATE "staff" SET "data" = \'{"a": 1}\'')

  // Check timestamp, binary, and jsonb columns
  const [staff] = await new SelectCommand("staff").limit(1).run(pool)

  t.true(staff.last_update instanceof Date)
  t.true(staff.picture instanceof Buffer)
  t.deepEqual((staff as any).data, { a: 1 })
})

test("first()", async (t) => {
  const { pool } = await getTestDatabase()
  const query = await new SelectCommand("film").orderBy("film_id").first()

  // Should limit results to 1
  t.true(query.compile().text.includes("LIMIT"))

  const result = await query.run(pool)

  assert<Equals<typeof result, schema.film.Selectable | undefined>>()
  t.is(result?.film_id, 1)
})

test(
  "forUpdate()",
  macro,
  (builder) => builder.first().forUpdate("film"),
  (t, _, query) => {
    t.true(query.text.includes("FOR UPDATE"))
  }
)

test(
  "forUpdate().noWait()",
  macro,
  (builder) => builder.first().forUpdate("film").noWait(),
  (t, _, query) => {
    t.true(query.text.includes("FOR UPDATE") && query.text.includes("NOWAIT"))
  }
)

test(
  "forUpdate().skipLocked()",
  macro,
  (builder) => builder.first().forUpdate("film").skipLocked(),
  (t, _, query) => {
    t.true(query.text.includes("SKIP LOCKED"))
  }
)

test(
  "forNoKeyUpdate()",
  macro,
  (builder) => builder.first().forNoKeyUpdate("film"),
  (t, _, query) => {
    t.true(query.text.includes("FOR NO KEY UPDATE"))
  }
)

test(
  "forNoKeyUpdate().noWait()",
  macro,
  (builder) => builder.first().forNoKeyUpdate("film").noWait(),
  (t, _, query) => {
    t.true(query.text.includes("NOWAIT"))
  }
)

test(
  "forNoKeyUpdate().skipLocked()",
  macro,
  (builder) => builder.first().forNoKeyUpdate("film").skipLocked(),
  (t, _, query) => {
    t.true(query.text.includes("SKIP LOCKED"))
  }
)

test(
  "forShare()",
  macro,
  (builder) => builder.first().forShare("film"),
  (t, _, query) => {
    t.true(query.text.includes("FOR SHARE"))
  }
)

test(
  "forShare().noWait()",
  macro,
  (builder) => builder.first().forShare("film").noWait(),
  (t, _, query) => {
    t.true(query.text.includes("NOWAIT"))
  }
)

test(
  "forShare().skipLocked()",
  macro,
  (builder) => builder.first().forShare("film").skipLocked(),
  (t, _, query) => {
    t.true(query.text.includes("SKIP LOCKED"))
  }
)

test(
  "forKeyShare()",
  macro,
  (builder) => builder.first().forKeyShare("film"),
  (t, _, query) => {
    t.true(query.text.includes("FOR KEY SHARE"))
  }
)

test(
  "forKeyShare().noWait()",
  macro,
  (builder) => builder.first().forKeyShare("film").noWait(),
  (t, _, query) => {
    t.true(query.text.includes("NOWAIT"))
  }
)

test(
  "forKeyShare().skipLocked()",
  macro,
  (builder) => builder.first().forKeyShare("film").skipLocked(),
  (t, _, query) => {
    t.true(query.text.includes("SKIP LOCKED"))
  }
)
