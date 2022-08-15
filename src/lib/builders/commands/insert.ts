import { mix } from "ts-mixer"
import { cols, sql, vals } from "zapatos/db"
import * as schema from "zapatos/schema"
import { SQLCommand } from "../common/sql-command"
import {
  ColumnSpecificationsForTableWithWildcards,
  constructColumnSelection,
  mapWithSeparator,
  SelectableFromColumnSpecifications,
} from "../utils"
import { OnConflictClauseBuilder } from "./clauses/on-conflict"

export interface InsertCommand<
  TableName extends schema.Table,
  SelectableMap extends Record<TableName, any> = Record<
    TableName,
    schema.SelectableForTable<TableName>
  >,
  Returning = never
> extends OnConflictClauseBuilder<TableName>,
    SQLCommand<Returning[]> {}

@mix(OnConflictClauseBuilder, SQLCommand)
export class InsertCommand<
  TableName extends schema.Table,
  SelectableMap extends Record<TableName, any> = Record<
    TableName,
    schema.SelectableForTable<TableName>
  >,
  Returning = never
> {
  private readonly _tableName: string
  private _rows: Array<schema.InsertableForTable<TableName>> = []
  private _returning: ColumnSpecificationsForTableWithWildcards<TableName>[] =
    []

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

  returning<T extends ColumnSpecificationsForTableWithWildcards<TableName>[]>(
    ...columnNames: T
  ): InsertCommand<
    TableName,
    SelectableMap,
    Returning &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>
  >
  returning<T extends ColumnSpecificationsForTableWithWildcards<TableName>[]>(
    columnSpecifications: T
  ): InsertCommand<
    TableName,
    SelectableMap,
    Returning &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>
  >
  returning<T extends ColumnSpecificationsForTableWithWildcards<TableName>[]>(
    ...args: any
  ): InsertCommand<
    TableName,
    SelectableMap,
    Returning &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>
  > {
    if (args.length === 1 && Array.isArray(args[0])) {
      this._returning = [...this._returning, ...args[0]]
    } else {
      this._returning = [...this._returning, ...args]
    }
    return this as any
  }

  compile() {
    const colsSQL = sql`${cols(this._rows[0])}`

    const valuesSQL = mapWithSeparator(
      this._rows,
      sql`, `,
      (v) => sql`(${vals(v)})`
    )

    const returningSQL =
      this._returning.length > 0
        ? sql`RETURNING ${constructColumnSelection(this._returning)}`
        : []

    return sql`INSERT INTO ${
      this._tableName
    } (${colsSQL}) VALUES ${valuesSQL} ${this.compileOnConflict(
      Object.keys(this._rows[0])
    )} ${returningSQL};`.compile()
  }
}
