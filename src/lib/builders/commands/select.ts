import { WhereableStatement } from "../common/where"
import { sql, param, cols } from "zapatos/db"
import * as schema from "zapatos/schema"
import { SQLCommand } from "../types"
import { mix } from "ts-mixer"

export interface SelectCommand<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>
> extends WhereableStatement<Whereable>,
    SQLCommand<Selectable> {}

@mix(WhereableStatement, SQLCommand)
export class SelectCommand<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>
> {
  private readonly _tableName: string
  private _limit?: number
  private _columnNames: (keyof Selectable)[] = []

  constructor(tableName: TableName) {
    this._tableName = tableName
  }

  columns<T extends (keyof Selectable)[]>(
    columnNames: T
  ): SelectCommand<TableName, Pick<Selectable, T[number]>, Whereable>
  columns<T extends (keyof Selectable)[]>(
    ...columnNames: T
  ): SelectCommand<TableName, Pick<Selectable, T[number]>, Whereable>
  columns<T extends (keyof Selectable)[]>(
    ...args: any
  ): SelectCommand<TableName, Pick<Selectable, T[number]>, Whereable> {
    if (args.length === 1 && Array.isArray(args[0])) {
      this._columnNames = args[0]
    } else {
      this._columnNames = args
    }
    return this
  }

  limit(limit: number) {
    this._limit = limit
    return this
  }

  compile() {
    const columnsSQL =
      this._columnNames.length > 0 ? cols(this._columnNames) : sql`*`
    const limitSQL = this._limit ? sql`LIMIT ${param(this._limit)}` : []

    return sql`SELECT ${columnsSQL} FROM ${this._tableName} WHERE ${this._whereable} ${limitSQL}`.compile()
  }
}
