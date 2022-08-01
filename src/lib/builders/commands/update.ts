import { cols, sql, vals } from "zapatos/db"
import * as schema from "zapatos/schema"
import { mix } from "ts-mixer"
import { WhereableStatement } from "../common/where"
import { SQLCommand } from "../types"

export interface UpdateCommand<
  TableName extends schema.Table,
  Updatable = schema.UpdatableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>
> extends WhereableStatement<Whereable>,
    SQLCommand<void> {}

@mix(WhereableStatement, SQLCommand)
export class UpdateCommand<
  TableName extends schema.Table,
  Updatable = schema.UpdatableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>
> {
  private readonly _tableName: string
  private _values: Partial<Updatable> = {}
  private _returning: (keyof schema.SelectableForTable<TableName>)[] = []

  constructor(tableName: TableName) {
    this._tableName = tableName
  }

  set<T extends keyof Updatable>(columnName: T, value: Updatable[T]): this
  set(values: Partial<Updatable>): this
  set(...args: any): this {
    if (Array.isArray(args) && args.length === 2) {
      this._values[args[0] as keyof Updatable] = args[1]
    } else if (args.length === 1) {
      this._values = {
        ...args[0],
      }
    }

    return this
  }

  // todo: support *
  returning<T extends (keyof schema.SelectableForTable<TableName>)[]>(
    columnNames: T
  ): this {
    this._returning = columnNames
    return this
  }

  compile() {
    const returningSQL =
      this._returning.length > 0 ? sql`RETURNING ${cols(this._returning)}` : []

    return sql`UPDATE ${this._tableName} SET (${cols(
      this._values
    )}) = ROW(${vals(this._values)}) WHERE ${
      this._whereable
    } ${returningSQL}`.compile()
  }
}
