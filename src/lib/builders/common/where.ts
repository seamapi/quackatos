import { Table, WhereableForTable, Whereable } from "zapatos/schema"
import { conditions, SQLFragment, AllType, all, sql, raw } from "zapatos/db"
import { mapWithSeparator } from "~/lib/builders/utils/map-with-separator"
import {
  ColumnSpecificationsForTable,
  ColumnSpecificationValue,
} from "../utils"

type WhereableConditions<W extends Whereable> = Array<{
  bool: "AND" | "OR"
  where?: W | SQLFragment | AllType
  nested?: WhereableConditions<W>
}>

export class WhereableStatement<
  TableName extends Table,
  W extends Whereable = WhereableForTable<TableName>
> {
  protected _whereable: WhereableConditions<W> = []

  whereIn<ColumnName extends ColumnSpecificationsForTable<TableName>>(
    columnName: ColumnName,
    values: ColumnSpecificationValue<TableName, ColumnName>[]
  ): this {
    this._whereable.push({
      bool: "AND",
      where: {
        [columnName]: conditions.isIn(values),
      } as any,
    })

    return this
  }

  where(
    args:
      | ((
          builder: WhereableStatement<TableName>
        ) => WhereableStatement<TableName>)
      | WhereableConditions<W>[number]["where"]
      | WhereableConditions<W>[number]
  ): this {
    const builder = new WhereableStatement<TableName>()

    if (typeof args == "function") {
      const configured = args(builder)
      return this.mergeIntoThis(configured._whereable)
    } else if (args === all) {
      this._whereable.push({ bool: "AND", where: args })
      return this
    } else if (Array.isArray(args)) {
      return this.mergeIntoThis(args)
    }

    this._whereable.push({ bool: "AND", where: args as any })
    return this
  }

  protected compileWhereable(): SQLFragment {
    return sql`${mapWithSeparator(
      this._whereable,
      sql`AND `,
      (where) => sql`${where.where! === all ? raw("TRUE") : where.where!}`
    )}`
  }

  protected throwIfWhereEmpty(msg = "There are no WHERE conditions") {
    if (this.isWhereEmpty()) {
      throw new Error(msg)
    }
  }

  protected isWhereEmpty() {
    return this.compileWhereable().compile().text.length === 0
  }

  private mergeIntoThis(whereable: WhereableConditions<any>): this {
    this._whereable = [...this._whereable, ...whereable]
    return this
  }
}
