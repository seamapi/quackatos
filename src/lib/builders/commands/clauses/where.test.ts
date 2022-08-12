import test from "ava"
import { getTestDatabase } from "~/tests"
import { mix } from "ts-mixer"
import * as schema from "zapatos/schema"
import { all, sql } from "zapatos/db"
import { WhereableStatement } from "./where"
import { SQLCommand } from "../../common/sql-command"

interface Runner<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>
> extends WhereableStatement<TableName, Whereable>,
    SQLCommand<Selectable[]> {}

@mix(WhereableStatement, SQLCommand)
class Runner<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>
> {
  constructor(private readonly tableName: TableName) {}

  compile() {
    return sql`SELECT * FROM ${
      this.tableName
    } WHERE ${this.compileWhereable()}`.compile()
  }
}

const macro = test.macro(
  async (t, callback: (builder: Runner<"film">) => Runner<"film">) => {
    const { pool } = await getTestDatabase()
    const runner = callback(new Runner<"film">("film"))
    const result = await runner.run(pool)

    t.not(result.length, 0)

    t.snapshot(result)
  }
)

test("whereIn()", macro, (builder) => builder.whereIn("film_id", [1, 2]))

test("where() (equality)", macro, (builder) => builder.where("film_id", 1))

test("where() (selectable)", macro, (builder) => builder.where({ film_id: 1 }))

test("where() (all)", async (t) => {
  const { pool } = await getTestDatabase()
  const result = await new Runner<"film">("film").where(all).run(pool)

  const {
    rows: [{ count }],
  } = await pool.query("SELECT COUNT(*) FROM film")

  t.is(result.length, parseInt(count, 10))
})
