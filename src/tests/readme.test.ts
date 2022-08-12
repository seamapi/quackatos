import test from "ava"
import { assert, Equals } from "tsafe"
import * as schema from "zapatos/schema"
import { getTestDatabase } from "./fixtures"
import q, { NullPartial } from "../index"

test("readme example 1", async (t) => {
  const { pool } = await getTestDatabase()

  const filmAndActor = await q("film")
    .leftJoin("film_actor", "film.film_id", "film_actor.film_id")
    .leftJoin("actor", "actor.actor_id", "film_actor.actor_id")
    .select("actor.first_name", "film.*")
    .limit(1)
    .run(pool)

  assert<
    Equals<
      typeof filmAndActor,
      (schema.film.Selectable &
        Pick<NullPartial<schema.actor.Selectable>, "first_name">)[]
    >
  >()

  t.pass()
})
