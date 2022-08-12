import { Table, WhereableForTable, Whereable } from "zapatos/schema"
import { conditions, SQLFragment, AllType, all, sql, raw } from "zapatos/db"
import { mapWithSeparator } from "~/lib/builders/utils/map-with-separator"
import {
  ColumnSpecificationsForTable,
  ColumnSpecificationValue,
} from "../../utils"

type WhereableCondition<W extends Whereable> = {
  bool: "AND" | "OR"
  where?: W | SQLFragment | AllType
  nested?: WhereableCondition<W>
}

export class WhereableStatement<
  TableName extends Table,
  W extends Whereable = WhereableForTable<TableName>
> {
  protected _whereable: WhereableCondition<W>[] = []

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

  where<ColumnName extends ColumnSpecificationsForTable<TableName>>(
    columnName: ColumnName,
    value: ColumnSpecificationValue<TableName, ColumnName>
  ): this
  where(selector: W): this
  where(
    callback: (
      builder: WhereableStatement<TableName>
    ) => WhereableStatement<TableName>
  ): this
  where(args: WhereableCondition<W>[]): this
  where(...args: any): this {
    if (args.length === 1) {
      const arg = args[0]
      if (typeof arg == "function") {
        const configured = arg(new WhereableStatement<TableName>())
        return this.mergeIntoThis(configured._whereable)
      } else if (arg === all) {
        this._whereable.push({ bool: "AND", where: arg })
        return this
      } else if (Array.isArray(arg)) {
        return this.mergeIntoThis(arg)
      }
    } else if (args.length === 2) {
      const [columnName, value] = args
      this._whereable.push({
        bool: "AND",
        where: { [columnName]: value } as any,
      })
      return this
    }

    this._whereable.push({ bool: "AND", where: args })
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

  private mergeIntoThis(whereable: WhereableCondition<any>[]): this {
    this._whereable = [...this._whereable, ...whereable]
    return this
  }
}
