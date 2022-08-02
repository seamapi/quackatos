import { cols, sql, vals } from "zapatos/db"
import * as schema from "zapatos/schema"
import { mix } from "ts-mixer"
import { WhereableStatement } from "../common/where"
import { SQLCommand } from "../types"
import {
  ColumnSpecificationsForTable,
  constructColumnSelection,
  SelectableForTableFromColumnSpecifications,
} from "./utils/construct-column-selection"

export interface UpdateCommand<
  TableName extends schema.Table,
  Updatable = schema.UpdatableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>,
  Returning = never
> extends WhereableStatement<Whereable>,
    SQLCommand<Returning> {}

@mix(WhereableStatement, SQLCommand)
export class UpdateCommand<
  TableName extends schema.Table,
  Updatable = schema.UpdatableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>,
  Returning = never
> {
  private readonly _tableName: string
  private _values: Partial<Updatable> = {}
  private _returning: ColumnSpecificationsForTable<TableName>[] = []

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
        // todo: should this merge?
        ...args[0],
      }
    }

    return this
  }

  returning<T extends ColumnSpecificationsForTable<TableName>>(
    columnSpecifications: T[]
  ): UpdateCommand<
    TableName,
    Updatable,
    Whereable,
    SelectableForTableFromColumnSpecifications<TableName, T>
  >
  returning<T extends ColumnSpecificationsForTable<TableName>>(
    ...columnNames: T[]
  ): UpdateCommand<
    TableName,
    Updatable,
    Whereable,
    SelectableForTableFromColumnSpecifications<TableName, T>
  >
  returning<T extends ColumnSpecificationsForTable<TableName>>(
    ...args: any
  ): UpdateCommand<
    TableName,
    Updatable,
    Whereable,
    SelectableForTableFromColumnSpecifications<TableName, T>
  > {
    if (args.length === 1 && Array.isArray(args[0])) {
      this._returning = args[0]
    } else {
      this._returning = args
    }
    return this as any
  }

  compile() {
    const returningSQL =
      this._returning.length > 0
        ? sql`RETURNING ${constructColumnSelection(this._returning)}`
        : []

    return sql`UPDATE ${this._tableName} SET (${cols(
      this._values
    )}) = ROW(${vals(this._values)}) WHERE ${
      this._whereable
    } ${returningSQL}`.compile()
  }
}
