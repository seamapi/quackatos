import test from "ava"
import { getTestDatabase } from "~/tests/fixtures/plugins"
import { mix } from "ts-mixer"
import * as schema from "zapatos/schema"
import { sql } from "zapatos/db"
import { WhereableStatement } from "./where"
import { SQLCommand } from "../types"

interface Runner<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>
> extends WhereableStatement<Whereable>,
    SQLCommand<Selectable> {}

@mix(WhereableStatement, SQLCommand)
class Runner<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>
> {
  constructor(private readonly tableName: TableName) {}

  compile() {
    return sql`SELECT * FROM ${this.tableName} WHERE ${this._whereable}`.compile()
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
