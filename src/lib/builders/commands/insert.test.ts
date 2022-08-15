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

  assert<Equals<typeof result, never[]>>()

  const {
    rows: [{ count: countAfterInsert }],
  } = await pool.query(`SELECT COUNT(*) FROM actor`)
  t.is(parseInt(countAfterInsert, 10), parseInt(countBeforeInsert, 10) + 2)
})

test("onConflict().doUpdateSet()", async (t) => {
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
    .doUpdateSet()
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

test("onConflict().doUpdateSet() (works with multiple targets)", async (t) => {
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
    .doUpdateSet()

  await t.notThrowsAsync(async () => await query.run(pool))

  const {
    rows: [rentalAfter],
  } = await pool.query("SELECT * FROM rental WHERE rental_id = 1")
  t.like(rentalAfter, {
    return_date: now,
  })
})

test("onConflictOnConstraint().doUpdateSet()", async (t) => {
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
    .doUpdateSet()

  await t.notThrowsAsync(async () => await query.run(pool))

  const {
    rows: [actorAfter],
  } = await pool.query("SELECT * FROM actor WHERE actor_id = 1")

  t.like(actorAfter, {
    first_name: "foo",
  })
})

test("onConflictOnConstraint().doUpdateSet() (only update specific columns)", async (t) => {
  const { pool } = await getTestDatabase()

  const {
    rows: [actor],
  } = await pool.query("SELECT * FROM actor WHERE actor_id = 1")

  await new InsertCommand("actor")
    .values({
      ...actor,
      first_name: "foo",
      last_name: "bar",
    })
    .onConflictOnConstraint("actor_pkey")
    .doUpdateSet("last_name")
    .run(pool)

  const {
    rows: [actorAfter],
  } = await pool.query("SELECT * FROM actor WHERE actor_id = 1")

  t.not(actorAfter.first_name, "foo")
  t.is(actorAfter.last_name, "bar")
})

test("onConflictOnConstraint().doUpdateSet() (use object to update)", async (t) => {
  const { pool } = await getTestDatabase()

  const {
    rows: [actor],
  } = await pool.query("SELECT * FROM actor WHERE actor_id = 1")

  await new InsertCommand("actor")
    .values({
      ...actor,
    })
    .onConflictOnConstraint("actor_pkey")
    .doUpdateSet({ first_name: "foo" })
    .run(pool)

  const {
    rows: [actorAfter],
  } = await pool.query("SELECT * FROM actor WHERE actor_id = 1")

  t.is(actorAfter.first_name, "foo")
})

test("onConflict().doUpdateSet() (fails because wrong target)", async (t) => {
  const { pool } = await getTestDatabase()

  const query = new InsertCommand("actor")
    .values({
      actor_id: 1,
      first_name: "foo",
      last_name: "bar",
    })
    .onConflict(["first_name"])
    .doUpdateSet()

  await t.throwsAsync(async () => await query.run(pool), {
    message:
      "there is no unique or exclusion constraint matching the ON CONFLICT specification",
  })
})

test("onConflict().doNothing()", async (t) => {
  const { pool } = await getTestDatabase()

  const query = new InsertCommand("actor")
    .values({
      actor_id: 1,
      first_name: "foo",
      last_name: "bar",
    })
    .onConflict(["actor_id"])
    .doNothing()

  await t.notThrowsAsync(async () => await query.run(pool))

  const {
    rows: [actor],
  } = await pool.query(`SELECT * FROM actor WHERE actor_id = 1`)

  t.not(actor.first_name, "foo")
  t.not(actor.last_name, "bar")
})

test("onConflict().doUpdateSet().where()", async (t) => {
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
    .doUpdateSet()
    .whereIn("actor.actor_id", [2])
    .run(pool)

  const {
    rows: [actor1, actor2],
  } = await pool.query(
    `SELECT * FROM actor WHERE actor_id IN (1, 2) ORDER BY actor_id`
  )

  t.not(actor1.first_name, "foo")
  t.is(actor2.first_name, "baz")
})

test("onConflict().doNothing().where()", async (t) => {
  const { pool } = await getTestDatabase()

  const query = new InsertCommand("actor")
    .values({
      actor_id: 1,
      first_name: "foo",
      last_name: "bar",
    })
    .onConflict(["actor_id"])
    .doNothing()
    .whereIn("actor_id", [1])

  await t.notThrowsAsync(async () => await query.run(pool))
})

test(".returning()", async (t) => {
  const { pool } = await getTestDatabase()

  const query = new InsertCommand("actor")
    .values({
      first_name: "foo",
      last_name: "bar",
    })
    .returning("first_name")

  const result = await query.run(pool)
  t.is(result.length, 1)
  t.deepEqual(result[0], {
    first_name: "foo",
  })
})

test(".returning() (array, wildcard)", async (t) => {
  const { pool } = await getTestDatabase()

  const query = new InsertCommand("actor")
    .values({
      first_name: "foo",
      last_name: "bar",
    })
    .returning(["actor.*"])

  const result = await query.run(pool)
  t.is(result.length, 1)
  t.like(result[0], {
    first_name: "foo",
    last_name: "bar",
  })
})
