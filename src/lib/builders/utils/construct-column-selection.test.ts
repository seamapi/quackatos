import test from "ava"
import { assert, Equals } from "tsafe"
import { ColumnSpecificationsForTableWithWildcards } from "./construct-column-selection"

test("typed correctly", (t) => {
  type PossibleSpecifications = ColumnSpecificationsForTableWithWildcards<
    "film" | "actor"
  >

  // Allow * notation
  assert<Equals<Extract<PossibleSpecifications, "*">, "*">>()

  // Allow TableName.* notation
  assert<Equals<Extract<PossibleSpecifications, "film.*">, "film.*">>()

  // Allow TableName.ColumnName notation
  assert<
    Equals<Extract<PossibleSpecifications, "film.film_id">, "film.film_id">
  >()

  // Allow ColumnName notation
  assert<Equals<Extract<PossibleSpecifications, "film_id">, "film_id">>()

  // These tables share the column name last_update, so it should not be part of the union
  assert<Equals<Extract<PossibleSpecifications, "last_update">, never>>()

  t.pass()
})
