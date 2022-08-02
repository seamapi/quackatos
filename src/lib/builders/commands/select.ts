import { WhereableStatement } from "../common/where"
import { sql, param } from "zapatos/db"
import * as schema from "zapatos/schema"
import { mix } from "ts-mixer"
import { SQLCommand } from "../types"
import {
  ColumnSpecificationsForTable,
  constructColumnSelection,
  SelectableForTableFromColumnSpecifications,
} from "./utils/construct-column-selection"

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
  private _columnSpecifications: ColumnSpecificationsForTable<TableName>[] = []

  constructor(tableName: TableName) {
    this._tableName = tableName
  }

  select<T extends ColumnSpecificationsForTable<TableName>>(
    columnSpecifications: T[]
  ): SelectCommand<
    TableName,
    SelectableForTableFromColumnSpecifications<TableName, T>
  >
  select<T extends ColumnSpecificationsForTable<TableName>>(
    ...columnNames: T[]
  ): SelectCommand<
    TableName,
    SelectableForTableFromColumnSpecifications<TableName, T>
  >
  select<T extends ColumnSpecificationsForTable<TableName>>(
    ...args: any
  ): SelectCommand<
    TableName,
    SelectableForTableFromColumnSpecifications<TableName, T>
  > {
    if (args.length === 1 && Array.isArray(args[0])) {
      this._columnSpecifications = args[0]
    } else {
      this._columnSpecifications = args
    }
    return this as any
  }

  limit(limit: number) {
    this._limit = limit
    return this
  }

  compile() {
    const limitSQL = this._limit ? sql`LIMIT ${param(this._limit)}` : []

    return sql`SELECT ${constructColumnSelection(
      this._columnSpecifications
    )} FROM ${this._tableName} WHERE ${this._whereable} ${limitSQL}`.compile()
  }
}
