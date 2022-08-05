import { cols, sql, vals } from "zapatos/db"
import * as schema from "zapatos/schema"
import { SQLCommand } from "../types"
import { mapWithSeparator } from "./utils/map-with-separator"

export class InsertCommand<
  TableName extends schema.Table
> extends SQLCommand<never> {
  private readonly _tableName: string
  private _rows: Array<schema.InsertableForTable<TableName>> = []

  constructor(tableName: TableName) {
    super()
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

  // todo: require values() to be called first
  // todo: add onconflict
  // todo: add returning
  compile() {
    const valuesSQL = mapWithSeparator(
      this._rows,
      sql`, `,
      (v) => sql`(${vals(v)})`
    )

    const result = sql`INSERT INTO ${this._tableName} (${cols(
      this._rows[0]
    )}) VALUES ${valuesSQL};`.compile()

    return result
  }
}
