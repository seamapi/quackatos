import { mix } from "ts-mixer"
import { cols, Constraint, sql, vals, constraint } from "zapatos/db"
import * as schema from "zapatos/schema"
import { SQLCommand } from "../types"
import { ColumnSpecificationsForTableWithoutWildcards } from "../utils/construct-column-selection"
import { mapWithSeparator } from "../utils/map-with-separator"

interface OnConflictSpecForTable<T extends schema.Table> {
  target: ColumnSpecificationsForTableWithoutWildcards<T>[] | Constraint<T>
  action: "DO NOTHING" | "DO UPDATE SET"
}

interface ConflictBuilder<Parent> {
  merge(): Parent
  ignore(): Parent
}

export interface InsertCommand<TableName extends schema.Table>
  extends SQLCommand<never> {}

@mix(SQLCommand)
export class InsertCommand<TableName extends schema.Table> {
  private readonly _tableName: string
  private _rows: Array<schema.InsertableForTable<TableName>> = []
  private _onConflict?: OnConflictSpecForTable<TableName>

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

  onConflict(
    ...columnNames: ColumnSpecificationsForTableWithoutWildcards<TableName>[]
  ): ConflictBuilder<this>
  onConflict(
    columnNames: ColumnSpecificationsForTableWithoutWildcards<TableName>[]
  ): ConflictBuilder<this>
  onConflict(...args: any[]): ConflictBuilder<this> {
    const target = args.length === 1 && Array.isArray(args[0]) ? args[0] : args

    return this._onConflictBuilderFactory(target)
  }

  onConflictOnConstraint(
    indexName: schema.UniqueIndexForTable<TableName>
  ): ConflictBuilder<this> {
    return this._onConflictBuilderFactory(constraint(indexName))
  }

  compile() {
    const colKeys = Object.keys(this._rows[0])
    const colsSQL = sql`${cols(this._rows[0])}`

    const valuesSQL = mapWithSeparator(
      this._rows,
      sql`, `,
      (v) => sql`(${vals(v)})`
    )

    let conflictSQL = sql``
    if (this._onConflict) {
      const conflictTargetSQL = Array.isArray(this._onConflict.target)
        ? sql`(${mapWithSeparator(this._onConflict.target, sql`, `, (c) => c)})`
        : sql`ON CONSTRAINT ${this._onConflict.target.value}`

      const columnsToUpdate = mapWithSeparator(
        colKeys.map((col) => col.split(".").pop()!),
        sql`, `,
        (c) => sql`${c} = EXCLUDED.${c}`
      )

      const conflictPart = sql`ON CONFLICT ${conflictTargetSQL} DO`
      const conflictActionPart =
        this._onConflict.action === "DO UPDATE SET"
          ? sql`UPDATE SET ${columnsToUpdate}`
          : sql`NOTHING`

      conflictSQL = sql`${conflictPart} ${conflictActionPart}`
    }

    return sql`INSERT INTO ${this._tableName} (${colsSQL}) VALUES ${valuesSQL} ${conflictSQL};`.compile()
  }

  private _onConflictBuilderFactory(
    target: OnConflictSpecForTable<TableName>["target"]
  ): ConflictBuilder<this> {
    return {
      // todo: rename?
      merge: () => {
        this._onConflict = {
          target,
          action: "DO UPDATE SET",
        }

        return this
      },
      ignore: () => {
        this._onConflict = {
          target,
          action: "DO NOTHING",
        }

        return this
      },
    }
  }
}
