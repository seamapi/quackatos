import { WhereableStatement } from "../common/where"
import { sql, param, SQLFragment, raw } from "zapatos/db"
import * as schema from "zapatos/schema"
import { mix } from "ts-mixer"
import { SQLCommand } from "../types"
import {
  ColumnSpecificationsForTableWithWildcards,
  ColumnSpecificationsForTable,
  constructColumnSelection,
  SelectableFromColumnSpecifications,
} from "../utils/construct-column-selection"
import { AnyJoin, constructJoinSQL } from "../utils/construct-join-sql"
import { NullPartial } from "~/lib/util-types"
import { mapWithSeparator } from "../utils/map-with-separator"
import { QueryResult } from "pg"
import { UpdateCommand } from "./update"
import { DeleteCommand } from "./delete"

type SelectResultMode = "MANY" | "NUMERIC"

interface OrderSpecForTable<T extends schema.Table> {
  by: ColumnSpecificationsForTable<T>
  direction: "ASC" | "DESC"
  nulls?: "FIRST" | "LAST"
}

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
> extends WhereableStatement<TableName, Whereable>,
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
  private readonly _tableName: TableName
  private _limit?: number
  private _order: OrderSpecForTable<TableName>[] = []
  private _columnSpecifications: (
    | ColumnSpecificationsForTableWithWildcards<TableName>
    | SQLFragment
  )[] = []
  private _joins: AnyJoin[] = []
  private _resultMode: SelectResultMode = "MANY"

  constructor(tableName: TableName) {
    this._tableName = tableName
  }

  select<T extends ColumnSpecificationsForTableWithWildcards<TableName>[]>(
    ...columnNames: T
  ): SelectCommand<
    TableName,
    (HasMadeCustomSelection extends true ? Selectable : {}) &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>,
    ResultMode,
    true,
    SelectableMap
  >
  select<T extends ColumnSpecificationsForTableWithWildcards<TableName>[]>(
    columnSpecifications: T
  ): SelectCommand<
    TableName,
    (HasMadeCustomSelection extends true ? Selectable : {}) &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>,
    ResultMode,
    true,
    SelectableMap
  >
  select<T extends ColumnSpecificationsForTableWithWildcards<TableName>[]>(
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
    column1: ColumnSpecificationsForTable<TableName | WithTableName>,
    column2: ColumnSpecificationsForTable<TableName | WithTableName>
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

  orderBy(
    by: OrderSpecForTable<TableName>["by"],
    direction?: OrderSpecForTable<TableName>["direction"]
  ): SelectCommand<TableName, Selectable, ResultMode, HasMadeCustomSelection>
  orderBy(
    spec: OrderSpecForTable<TableName>
  ): SelectCommand<TableName, Selectable, ResultMode, HasMadeCustomSelection>
  orderBy(
    specs: {
      by: OrderSpecForTable<TableName>["by"]
      direction?: OrderSpecForTable<TableName>["direction"]
    }[]
  ): SelectCommand<TableName, Selectable, ResultMode, HasMadeCustomSelection>
  orderBy(
    specs: OrderSpecForTable<TableName>[]
  ): SelectCommand<TableName, Selectable, ResultMode, HasMadeCustomSelection>
  orderBy(
    ...args: any
  ): SelectCommand<TableName, Selectable, ResultMode, HasMadeCustomSelection> {
    if (typeof args[0] === "string") {
      // (by, direction)
      this._order.push({
        by: args[0] as any,
        direction: args[1] ?? "ASC",
      })
    } else if (args.length === 1 && !Array.isArray(args[0])) {
      // (spec)
      this._order.push(args[0])
    } else if (args.length === 1 && Array.isArray(args[0])) {
      // (specs (partial or full))
      this._order.push(
        ...args[0].map((spec) => ({
          direction: "ASC",
          ...spec,
        }))
      )
    }

    return this
  }

  delete() {
    return new DeleteCommand<TableName>(this._tableName).where(this._whereable)
  }

  update() {
    return new UpdateCommand<TableName>(this._tableName).where(this._whereable)
  }

  compile() {
    const limitSQL = this._limit ? sql`LIMIT ${param(this._limit)}` : []

    const stringColumnSpecifications = this._columnSpecifications.filter(
      (spec) => typeof spec === "string"
    ) as ColumnSpecificationsForTableWithWildcards<TableName>[]
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

    const orderSQL =
      this._order.length === 0
        ? []
        : sql` ORDER BY ${mapWithSeparator(this._order, sql`, `, (o) => {
            if (!["ASC", "DESC"].includes(o.direction))
              throw new Error(
                `Direction must be ASC/DESC, not '${o.direction}'`
              )
            if (o.nulls && !["FIRST", "LAST"].includes(o.nulls))
              throw new Error(
                `Nulls must be FIRST/LAST/undefined, not '${o.nulls}'`
              )
            return sql`${o.by.toString()} ${raw(o.direction)}${
              o.nulls ? sql` NULLS ${raw(o.nulls)}` : []
            }`
          })}`

    return sql`SELECT ${columnsSQL} FROM ${this._tableName} ${constructJoinSQL(
      this._joins
    )} WHERE ${
      this.isWhereEmpty() ? raw("TRUE") : this.compileWhereable()
    } ${orderSQL} ${limitSQL}`.compile()
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
