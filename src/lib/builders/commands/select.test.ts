import test from "ava"
import { createMacroForBuilder } from "~/tests"
import { SelectCommand } from "./select"

const macro = createMacroForBuilder({
  builderFactory: () => new SelectCommand("film"),
})

test("columns() (rest parameter)", macro, (builder) =>
  builder.columns("title", "description").limit(1)
)

test("columns() (array)", macro, (builder) =>
  builder.columns(["title", "description"]).limit(1)
)

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
