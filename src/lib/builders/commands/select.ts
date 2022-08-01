import { WhereableStatement } from "../common/where"
import { sql, param, cols } from "zapatos/db"
import { SQLCommand } from "../types"
import { mix } from "ts-mixer"

export interface SelectCommand<Selectable, Whereable>
  extends WhereableStatement<Whereable>,
    SQLCommand<Selectable> {}

@mix(WhereableStatement, SQLCommand)
export class SelectCommand<Selectable, Whereable> {
  private readonly _tableName: string
  private _limit?: number
  private _columns: (keyof Selectable)[] = []

  constructor(tableName: string) {
    this._tableName = tableName
  }

  columns<T extends (keyof Selectable)[]>(
    columns: T
  ): SelectCommand<Pick<Selectable, T[number]>, Whereable>
  columns<T extends (keyof Selectable)[]>(
    ...columns: T
  ): SelectCommand<Pick<Selectable, T[number]>, Whereable>
  columns<T extends (keyof Selectable)[]>(
    ...args: any
  ): SelectCommand<Pick<Selectable, T[number]>, Whereable> {
    if (args.length === 1 && Array.isArray(args[0])) {
      this._columns = args[0]
    } else {
      this._columns = args
    }
    return this
  }

  limit(limit: number) {
    this._limit = limit
    return this
  }

  compile() {
    const columnsSQL = this._columns.length > 0 ? cols(this._columns) : sql`*`
    const limitSQL = this._limit ? sql`LIMIT ${param(this._limit)}` : []

    return sql`SELECT ${columnsSQL} FROM ${this._tableName} WHERE ${this._whereable} ${limitSQL}`.compile()
  }
}
