import { WhereableStatement } from "../common/where"
import { sql, param, SQLFragment } from "zapatos/db"
import * as schema from "zapatos/schema"
import { mix } from "ts-mixer"
import { SQLCommand } from "../types"
import {
  ColumnSpecificationsForTable,
  ColumnSpecificationsForTableWithoutWildcards,
  constructColumnSelection,
  SelectableFromColumnSpecifications,
} from "./utils/construct-column-selection"
import { AnyJoin, constructJoinSQL } from "./utils/construct-join-sql"
import { NullPartial } from "~/lib/util-types"

export interface SelectCommand<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  SelectableMap extends Record<TableName, any> = Record<
    TableName,
    schema.SelectableForTable<TableName>
  >,
  Whereable = schema.WhereableForTable<TableName>
> extends WhereableStatement<Whereable>,
    SQLCommand<Selectable> {}

@mix(WhereableStatement, SQLCommand)
export class SelectCommand<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  SelectableMap extends Record<TableName, any> = Record<
    TableName,
    schema.SelectableForTable<TableName>
  >,
  Whereable = schema.WhereableForTable<TableName>
> {
  private readonly _tableName: string
  private _limit?: number
  private _columnSpecifications: ColumnSpecificationsForTable<TableName>[] = []
  private _joins: AnyJoin[] = []

  constructor(tableName: TableName) {
    this._tableName = tableName
  }

  // todo: "film.*", "film.des..." doesn't autocomplete
  select<T extends ColumnSpecificationsForTable<TableName>>(
    columnSpecifications: T[]
  ): SelectCommand<
    TableName,
    SelectableFromColumnSpecifications<TableName, T, SelectableMap>,
    SelectableMap
  >
  select<T extends ColumnSpecificationsForTable<TableName>>(
    ...columnNames: T[]
  ): SelectCommand<
    TableName,
    SelectableFromColumnSpecifications<TableName, T, SelectableMap>,
    SelectableMap
  >
  select<T extends ColumnSpecificationsForTable<TableName>>(
    ...args: any
  ): SelectCommand<
    TableName,
    SelectableFromColumnSpecifications<TableName, T, SelectableMap>,
    SelectableMap
  > {
    if (args.length === 1 && Array.isArray(args[0])) {
      this._columnSpecifications = args[0]
    } else {
      this._columnSpecifications = args
    }
    return this as any
  }

  // todo: should accept WhereableStatement
  leftJoin<WithTableName extends schema.Table>(
    withTableName: WithTableName,
    column1: ColumnSpecificationsForTableWithoutWildcards<
      TableName | WithTableName
    >,
    column2: ColumnSpecificationsForTableWithoutWildcards<
      TableName | WithTableName
    >
  ): SelectCommand<
    TableName | WithTableName,
    Selectable,
    SelectableMap &
      Record<
        WithTableName,
        NullPartial<schema.SelectableForTable<WithTableName>>
      >
  >
  leftJoin<WithTableName extends schema.Table>(
    withTableName: WithTableName,
    condition: SQLFragment
  ): SelectCommand<
    TableName | WithTableName,
    Selectable,
    SelectableMap &
      Record<
        WithTableName,
        NullPartial<schema.SelectableForTable<WithTableName>>
      >
  >
  leftJoin<WithTableName extends schema.Table>(
    ...args: any
  ): SelectCommand<
    TableName | WithTableName,
    Selectable,
    SelectableMap &
      Record<
        WithTableName,
        NullPartial<schema.SelectableForTable<WithTableName>>
      >
  > {
    if (args.length === 3) {
      const [withTableName, column1, column2] = args

      this._joins.push({
        type: "leftJoin",
        table: withTableName,
        on: sql`${column1} = ${column2}`,
      })
    } else if (args.length === 2) {
      const [withTableName, condition] = args
      this._joins.push({
        type: "leftJoin",
        table: withTableName,
        on: condition,
      })
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
    )} FROM ${this._tableName} ${constructJoinSQL(this._joins)} WHERE ${
      this._whereable
    } ${limitSQL}`.compile()
  }
}
