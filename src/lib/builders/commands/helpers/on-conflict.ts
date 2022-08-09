import {
  cols,
  constraint,
  Constraint,
  raw,
  sql,
  SQLFragment,
  vals,
} from "zapatos/db"
import * as schema from "zapatos/schema"
import {
  ColumnSpecificationsForTable,
  mapWithSeparator,
} from "~/lib/builders/utils"
import { WhereableStatement } from "~/lib/builders/common"

interface OnConflictSpecForTable<T extends schema.Table> {
  target: ColumnSpecificationsForTable<T>[] | Constraint<T>
  columnsToUpdate?: ColumnSpecificationsForTable<T>[]
  values?: Partial<schema.InsertableForTable<T>>
  action: "DO NOTHING" | "DO UPDATE SET"
}

interface ConflictBuilder<TableName extends schema.Table, Parent> {
  /**
   * Defaults to updating (merging) all columns.
   * Pass column names to override this behavior, or an object of values to use during the update.
   */
  doUpdateSet(
    columnsToUpdate?: ColumnSpecificationsForTable<TableName>[]
  ): Parent
  doUpdateSet(
    ...columnsToUpdate: ColumnSpecificationsForTable<TableName>[]
  ): Parent
  doUpdateSet(values: Partial<schema.InsertableForTable<TableName>>): Parent

  doNothing(): Parent
}

export class OnConflictBuilder<
  TableName extends schema.Table
> extends WhereableStatement<TableName> {
  private _onConflict?: OnConflictSpecForTable<TableName>

  onConflict(
    ...columnNames: ColumnSpecificationsForTable<TableName>[]
  ): ConflictBuilder<TableName, this>
  onConflict(
    columnNames: ColumnSpecificationsForTable<TableName>[]
  ): ConflictBuilder<TableName, this>
  onConflict(...args: any[]): ConflictBuilder<TableName, this> {
    const target = args.length === 1 && Array.isArray(args[0]) ? args[0] : args

    return this._onConflictBuilderFactory(target)
  }

  onConflictOnConstraint(
    indexName: schema.UniqueIndexForTable<TableName>
  ): ConflictBuilder<TableName, this> {
    return this._onConflictBuilderFactory(constraint(indexName))
  }

  protected compileOnConflict(columnNames: string[]): SQLFragment {
    let conflictSQL = sql``
    if (this._onConflict) {
      const conflictTargetSQL = Array.isArray(this._onConflict.target)
        ? sql`(${mapWithSeparator(this._onConflict.target, sql`, `, (c) => c)})`
        : sql`ON CONSTRAINT ${this._onConflict.target.value}`

      const colKeys = this._onConflict.columnsToUpdate ?? columnNames

      const columnsToUpdate = this._onConflict.values
        ? sql`(${cols(this._onConflict.values)}) = ROW(${vals(
            this._onConflict.values
          )})`
        : mapWithSeparator(
            colKeys.map((col) => col.toString().split(".").pop()!),
            sql`, `,
            (c) => sql`${c} = EXCLUDED.${c}`
          )

      const whereSQL = sql`WHERE ${
        this.isWhereEmpty() ? raw("TRUE") : this.compileWhereable()
      }`

      const conflictPart = sql`ON CONFLICT ${conflictTargetSQL} ${
        this._onConflict.action === "DO NOTHING" ? whereSQL : sql``
      } DO`
      const conflictActionPart =
        this._onConflict.action === "DO UPDATE SET"
          ? sql`UPDATE SET ${columnsToUpdate} ${whereSQL}`
          : sql`NOTHING`

      conflictSQL = sql`${conflictPart} ${conflictActionPart}`
    }

    return conflictSQL
  }

  private _onConflictBuilderFactory(
    target: OnConflictSpecForTable<TableName>["target"]
  ): ConflictBuilder<TableName, this> {
    const builder: ConflictBuilder<TableName, this> = {
      doUpdateSet: (...args: any[]) => {
        this._onConflict = {
          target,
          action: "DO UPDATE SET",
          columnsToUpdate: args.length > 0 ? args.flat() : undefined,
          values:
            args.length === 1 && typeof args[0] === "object"
              ? args[0]
              : undefined,
        }

        return this
      },
      doNothing: () => {
        this._onConflict = {
          target,
          action: "DO NOTHING",
        }

        return this
      },
    }

    return builder
  }
}
