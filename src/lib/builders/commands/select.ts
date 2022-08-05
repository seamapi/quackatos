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
import { mapWithSeparator } from "./utils/map-with-separator"
import { QueryResult } from "pg"

type SelectResultMode = "MANY" | "NUMERIC"

type ReturnTypeForModeMap<Selectable> = {
  MANY: Selectable[]
  NUMERIC: number
}

export interface SelectCommand<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  ResultMode extends SelectResultMode = "MANY",
  HasMadeCustomSelection extends boolean = false,
  SelectableMap extends Record<TableName, any> = Record<
    TableName,
    schema.SelectableForTable<TableName>
  >,
  Whereable = schema.WhereableForTable<TableName>
> extends WhereableStatement<Whereable>,
    SQLCommand<ReturnTypeForModeMap<Selectable>[ResultMode]> {}

@mix(WhereableStatement, SQLCommand)
export class SelectCommand<
  TableName extends schema.Table,
  Selectable = schema.SelectableForTable<TableName>,
  ResultMode extends SelectResultMode = "MANY",
  HasMadeCustomSelection extends boolean = false,
  SelectableMap extends Record<TableName, any> = Record<
    TableName,
    schema.SelectableForTable<TableName>
  >,
  Whereable = schema.WhereableForTable<TableName>
> {
  private readonly _tableName: string
  private _limit?: number
  private _columnSpecifications: (
    | ColumnSpecificationsForTable<TableName>
    | SQLFragment
  )[] = []
  private _joins: AnyJoin[] = []
  private _resultMode: SelectResultMode = "MANY"

  constructor(tableName: TableName) {
    this._tableName = tableName
  }

  select<T extends ColumnSpecificationsForTable<TableName>[]>(
    ...columnNames: T
  ): SelectCommand<
    TableName,
    (HasMadeCustomSelection extends true ? Selectable : {}) &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>,
    ResultMode,
    true,
    SelectableMap
  >
  select<T extends ColumnSpecificationsForTable<TableName>[]>(
    columnSpecifications: T
  ): SelectCommand<
    TableName,
    (HasMadeCustomSelection extends true ? Selectable : {}) &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>,
    ResultMode,
    true,
    SelectableMap
  >
  select<T extends ColumnSpecificationsForTable<TableName>[]>(
    ...args: any
  ): SelectCommand<
    TableName,
    (HasMadeCustomSelection extends true ? Selectable : {}) &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>,
    ResultMode,
    true,
    SelectableMap
  > {
    if (args.length === 1 && Array.isArray(args[0])) {
      this._columnSpecifications = args[0]
    } else {
      this._columnSpecifications = args
    }
    return this as any
  }

  count(): SelectCommand<TableName, Selectable, "NUMERIC"> {
    this._columnSpecifications.push(sql`COUNT(*)`)
    this._resultMode = "NUMERIC"

    return this as any
  }

  // todo: should accept WhereableStatement
  leftJoin<WithTableName extends schema.Table>(
    withTableName: WithTableName,
    // todo: type should require one column to be from WithTableName
    // todo: type should not allow the second column to be from the first column's table
    column1: ColumnSpecificationsForTableWithoutWildcards<
      TableName | WithTableName
    >,
    column2: ColumnSpecificationsForTableWithoutWildcards<
      TableName | WithTableName
    >
  ): SelectCommand<
    TableName | WithTableName,
    Selectable,
    ResultMode,
    false,
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
    ResultMode,
    false,
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
    ResultMode,
    false,
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

    const stringColumnSpecifications = this._columnSpecifications.filter(
      (spec) => typeof spec === "string"
    ) as ColumnSpecificationsForTable<TableName>[]
    const sqlColumnSpecifications = this._columnSpecifications.filter(
      (spec) => typeof spec !== "string"
    ) as SQLFragment[]

    let columnsSQL =
      stringColumnSpecifications.length > 0 ||
      sqlColumnSpecifications.length > 0
        ? mapWithSeparator(
            [
              ...(stringColumnSpecifications.length > 0
                ? [constructColumnSelection(stringColumnSpecifications)]
                : []),
              ...sqlColumnSpecifications,
            ],
            sql`, `,
            (v) => v
          )
        : sql`*`

    return sql`SELECT ${columnsSQL} FROM ${this._tableName} ${constructJoinSQL(
      this._joins
    )} WHERE ${this._whereable} ${limitSQL}`.compile()
  }

  protected transformResult(result: QueryResult): any {
    switch (this._resultMode) {
      case "MANY":
        return result.rows
      case "NUMERIC":
        return parseInt(result.rows[0].count, 10)
    }
  }
}
