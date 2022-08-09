import { cols, sql, vals } from "zapatos/db"
import * as schema from "zapatos/schema"
import { mix } from "ts-mixer"
import { WhereableStatement } from "../common/where"
import { SQLCommand } from "../types"
import {
  ColumnSpecificationsForTableWithWildcards,
  constructColumnSelection,
  SelectableFromColumnSpecifications,
} from "../utils/construct-column-selection"

export interface UpdateCommand<
  TableName extends schema.Table,
  Updatable = schema.UpdatableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>,
  SelectableMap extends Record<TableName, any> = Record<
    TableName,
    schema.SelectableForTable<TableName>
  >,
  Returning = {}
> extends WhereableStatement<TableName, Whereable>,
    SQLCommand<Returning[]> {}

@mix(WhereableStatement, SQLCommand)
export class UpdateCommand<
  TableName extends schema.Table,
  Updatable = schema.UpdatableForTable<TableName>,
  Whereable = schema.WhereableForTable<TableName>,
  SelectableMap extends Record<TableName, any> = Record<
    TableName,
    schema.SelectableForTable<TableName>
  >,
  Returning = {}
> {
  private readonly _tableName: string
  private _values: Partial<Updatable> = {}
  private _returning: ColumnSpecificationsForTableWithWildcards<TableName>[] =
    []

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
        ...this._values,
        ...args[0],
      }
    }

    return this
  }

  returning<T extends ColumnSpecificationsForTableWithWildcards<TableName>[]>(
    ...columnNames: T
  ): UpdateCommand<
    TableName,
    Updatable,
    Whereable,
    SelectableMap,
    Returning &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>
  >
  returning<T extends ColumnSpecificationsForTableWithWildcards<TableName>[]>(
    columnSpecifications: T
  ): UpdateCommand<
    TableName,
    Updatable,
    Whereable,
    SelectableMap,
    Returning &
      SelectableFromColumnSpecifications<TableName, T[number], SelectableMap>
  >
  returning<T extends ColumnSpecificationsForTableWithWildcards<TableName>[]>(
    ...args: any
  ): UpdateCommand<
    TableName,
    Updatable,
    Whereable,
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
    this.throwIfWhereEmpty()

    const returningSQL =
      this._returning.length > 0
        ? sql`RETURNING ${constructColumnSelection(this._returning)}`
        : []

    return sql`UPDATE ${this._tableName} SET (${cols(
      this._values
    )}) = ROW(${vals(
      this._values
    )}) WHERE ${this.compileWhereable()} ${returningSQL}`.compile()
  }
}
