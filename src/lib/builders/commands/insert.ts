import { mix } from "ts-mixer"
import { cols, sql, vals } from "zapatos/db"
import * as schema from "zapatos/schema"
import { SQLCommand } from "../common/sql-command"
import { mapWithSeparator } from "../utils/map-with-separator"
import { OnConflictClauseBuilder } from "./clauses/on-conflict"

export interface InsertCommand<TableName extends schema.Table>
  extends OnConflictClauseBuilder<TableName>,
    SQLCommand<never> {}

@mix(OnConflictClauseBuilder, SQLCommand)
export class InsertCommand<TableName extends schema.Table> {
  private readonly _tableName: string
  private _rows: Array<schema.InsertableForTable<TableName>> = []

  constructor(tableName: TableName) {
    this._tableName = tableName
  }

  values(...rows: Array<schema.InsertableForTable<TableName>>): this
  values(rows: Array<schema.InsertableForTable<TableName>>[]): this
  values(...args: any[]): this {
    if (args.length === 1 && Array.isArray(args[0])) {
      this._rows = this._rows.concat(args[0])
    } else {
      this._rows = this._rows.concat(args)
    }

    return this
  }

  compile() {
    const colsSQL = sql`${cols(this._rows[0])}`

    const valuesSQL = mapWithSeparator(
      this._rows,
      sql`, `,
      (v) => sql`(${vals(v)})`
    )

    return sql`INSERT INTO ${
      this._tableName
    } (${colsSQL}) VALUES ${valuesSQL} ${this.compileOnConflict(
      Object.keys(this._rows[0])
    )};`.compile()
  }
}
