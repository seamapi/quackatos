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

test("onConflict().merge()", async (t) => {
  const { pool } = await getTestDatabase()

  await new InsertCommand("actor")
    .values(
      {
        actor_id: 1,
        first_name: "foo",
        last_name: "bar",
      },
      {
        actor_id: 2,
        first_name: "baz",
        last_name: "qux",
      }
    )
    .onConflict(["actor_id"])
    .merge()
    .run(pool)

  const {
    rows: [actor1, actor2],
  } = await pool.query(
    `SELECT * FROM actor WHERE actor_id IN (1, 2) ORDER BY actor_id`
  )

  t.like(actor1, {
    first_name: "foo",
    last_name: "bar",
  })

  t.like(actor2, {
    first_name: "baz",
    last_name: "qux",
  })
})

test("onConflict().merge() (works with multiple targets)", async (t) => {
  const { pool } = await getTestDatabase()

  const {
    rows: [rental],
  } = await pool.query("SELECT * FROM rental WHERE rental_id = 1")

  const now = new Date()

  const query = new InsertCommand("rental")
    .values({
      ...rental,
      return_date: now,
    })
    .onConflict("rental_date", "inventory_id", "customer_id")
    .merge()

  await t.notThrowsAsync(async () => await query.run(pool))

  const {
    rows: [rentalAfter],
  } = await pool.query("SELECT * FROM rental WHERE rental_id = 1")
  t.like(rentalAfter, {
    return_date: now,
  })
})

test("onConflict().merge() (works with constraint)", async (t) => {
  const { pool } = await getTestDatabase()

  const {
    rows: [actor],
  } = await pool.query("SELECT * FROM actor WHERE actor_id = 1")

  const query = new InsertCommand("actor")
    .values({
      ...actor,
      first_name: "foo",
    })
    .onConflictOnConstraint("actor_pkey")
    .merge()

  await t.notThrowsAsync(async () => await query.run(pool))

  const {
    rows: [actorAfter],
  } = await pool.query("SELECT * FROM actor WHERE actor_id = 1")

  t.like(actorAfter, {
    first_name: "foo",
  })
})

test("onConflict().merge() (fails because wrong target)", async (t) => {
  const { pool } = await getTestDatabase()

  const query = new InsertCommand("actor")
    .values({
      actor_id: 1,
      first_name: "foo",
      last_name: "bar",
    })
    .onConflict(["first_name"])
    .merge()

  await t.throwsAsync(async () => await query.run(pool))
})

test("onConflict().ignore()", async (t) => {
  const { pool } = await getTestDatabase()

  const query = new InsertCommand("actor")
    .values({
      actor_id: 1,
      first_name: "foo",
      last_name: "bar",
    })
    .onConflict(["actor_id"])
    .ignore()

  await t.notThrowsAsync(async () => await query.run(pool))

  const {
    rows: [actor],
  } = await pool.query(`SELECT * FROM actor WHERE actor_id = 1`)

  t.not(actor.first_name, "foo")
  t.not(actor.last_name, "bar")
})
